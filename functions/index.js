const functions = require("firebase-functions");
const https = require("https");
const admin = require("firebase-admin");
admin.initializeApp();

// Shared guard used by every admin-only callable below: confirms the
// caller is signed in AND has a doc in /admins (i.e. is really an admin),
// not just someone who found the function name.
async function assertIsAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be signed in.");
  }
  const adminDoc = await admin.firestore().doc(`admins/${context.auth.uid}`).get();
  if (!adminDoc.exists) {
    throw new functions.https.HttpsError("permission-denied", "Admin access required.");
  }
}

// ============================================================
// verifyPaystackTx — GET /verifyPaystackTx?reference=xxxx
// The app calls this after checkout instead of trusting the client-side
// redirect alone. It calls Paystack's /transaction/verify endpoint using
// the SECRET key (stored only here, via `firebase functions:config:set`),
// and returns a clean { verified, amount, currency } payload.
//
// Deploy:
//   firebase functions:config:set paystack.secret="sk_live_xxx"
//   firebase deploy --only functions
// ============================================================
exports.verifyPaystackTx = functions.https.onRequest((req, res) => {
  const reference = req.query.reference;
  if (!reference) {
    res.status(400).json({ verified: false, error: "Missing reference" });
    return;
  }

  const secretKey = functions.config().paystack?.secret;
  if (!secretKey) {
    res.status(500).json({ verified: false, error: "Paystack secret not configured" });
    return;
  }

  const options = {
    hostname: "api.paystack.co",
    path: `/transaction/verify/${encodeURIComponent(reference)}`,
    method: "GET",
    headers: { Authorization: `Bearer ${secretKey}` },
  };

  const pReq = https.request(options, (pRes) => {
    let body = "";
    pRes.on("data", (chunk) => (body += chunk));
    pRes.on("end", () => {
      try {
        const json = JSON.parse(body);
        const tx = json.data;
        const ok = json.status && tx && tx.status === "success";
        res.status(200).json({
          verified: !!ok,
          amount: tx ? tx.amount / 100 : null,
          currency: tx ? tx.currency : null,
          reference,
        });
      } catch (e) {
        res.status(500).json({ verified: false, error: "Could not parse Paystack response" });
      }
    });
  });

  pReq.on("error", (e) => res.status(500).json({ verified: false, error: e.message }));
  pReq.end();
});

// ============================================================
// sendPushOnNotificationCreate — Firestore trigger
// Whenever the app writes a doc to /notifications, this automatically
// forwards it as a real push notification via Expo's push API to every
// device token that matches (or every user, for a "broadcast").
// ============================================================
exports.sendPushOnNotificationCreate = functions.firestore
  .document("notifications/{id}")
  .onCreate(async (snap) => {
    const { userId, title, body } = snap.data();

    let tokens = [];
    if (userId === "broadcast") {
      const usersSnap = await admin.firestore().collection("users").get();
      tokens = usersSnap.docs.map((d) => d.data().fcmToken).filter(Boolean);
    } else {
      const userDoc = await admin.firestore().doc(`users/${userId}`).get();
      if (userDoc.exists && userDoc.data().fcmToken) tokens = [userDoc.data().fcmToken];
    }

    if (tokens.length === 0) return null;

    const messages = tokens.map((to) => ({ to, sound: "default", title, body }));
    const payload = JSON.stringify(messages);

    return new Promise((resolve) => {
      const req = https.request(
        {
          hostname: "exp.host",
          path: "/--/api/v2/push/send",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
        },
        (r) => { r.on("data", () => {}); r.on("end", resolve); }
      );
      req.on("error", () => resolve());
      req.write(payload);
      req.end();
    });
  });

// ============================================================
// ADMIN USER CRUD — callable functions
// The client SDK can only manage its OWN Firebase Auth account, so
// creating/deleting *other people's* accounts on the admin's behalf has
// to happen here with the Admin SDK. Called from src/services/adminService.js
// via httpsCallable(functions, "adminCreateUser" / "adminDeleteUser").
// ============================================================

// Creates a new donor account (Auth user + Firestore /users doc) without
// disturbing the admin's own signed-in session (which creating a user
// client-side would otherwise do).
exports.adminCreateUser = functions.https.onCall(async (data, context) => {
  await assertIsAdmin(context);

  const { firstName, lastName, email, phone, password } = data;
  if (!email || !password || !firstName) {
    throw new functions.https.HttpsError("invalid-argument", "firstName, email and password are required.");
  }

  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: `${firstName} ${lastName || ""}`.trim(),
  });

  const profile = {
    uid: userRecord.uid,
    firstName,
    lastName: lastName || "",
    email,
    phone: phone || "",
    role: "donor",
    photoURL: null,
    totalDonated: 0,
    blocked: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdByAdmin: context.auth.uid,
  };
  await admin.firestore().doc(`users/${userRecord.uid}`).set(profile);

  await admin.firestore().collection("auditLogs").add({
    adminUid: context.auth.uid,
    action: "create_user",
    targetId: userRecord.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { uid: userRecord.uid };
});

// Deletes a donor's Auth account AND their Firestore doc together, so no
// orphaned login-without-a-profile (or profile-without-a-login) is left
// behind. Firestore-only deletion (for offline/emergency use) is still
// available client-side via deleteUserDoc in firestoreService.js.
exports.adminDeleteUser = functions.https.onCall(async (data, context) => {
  await assertIsAdmin(context);

  const { uid } = data;
  if (!uid) throw new functions.https.HttpsError("invalid-argument", "uid is required.");

  await admin.auth().delete(uid).catch((e) => {
    // If the Auth user is already gone, still clean up Firestore below.
    if (e.code !== "auth/user-not-found") throw e;
  });
  await admin.firestore().doc(`users/${uid}`).delete();

  await admin.firestore().collection("auditLogs").add({
    adminUid: context.auth.uid,
    action: "delete_user",
    targetId: uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { deleted: true };
});
