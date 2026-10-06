import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from "firebase/auth";
import { Platform } from "react-native";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { saveData, getData, removeData, StorageKeys } from "../utils/storage";
import { logActivity } from "./firestoreService";

// ---------- DONOR / GENERAL USER ----------

export async function registerUser({ firstName, lastName, email, phone, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: `${firstName} ${lastName}` });

  const profile = {
    uid: cred.user.uid,
    firstName,
    lastName,
    email,
    phone,
    role: "donor",
    photoURL: null,
    totalDonated: 0,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, "users", cred.user.uid), profile);
  await saveData(StorageKeys.USER_PROFILE, profile);
  await saveData(StorageKeys.AUTH_ROLE, "donor");
  await logActivity({ uid: cred.user.uid, email, role: "donor", action: "register", meta: { platform: Platform.OS } });
  return profile;
}

export async function loginUser({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  const profile = snap.exists() ? snap.data() : { uid: cred.user.uid, email };
  await saveData(StorageKeys.USER_PROFILE, profile);
  await saveData(StorageKeys.AUTH_ROLE, "donor");
  await logActivity({ uid: cred.user.uid, email, role: "donor", action: "login", meta: { platform: Platform.OS } });
  return profile;
}

// ---------- NGO ----------

export async function registerNgo({ name, email, phone, registrationNumber, category, description, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const ngoProfile = {
    ngoId: cred.user.uid,
    ownerUid: cred.user.uid,
    name,
    email,
    phone,
    registrationNumber,
    category,
    description,
    logoURL: null,
    verified: false,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, "ngos", cred.user.uid), ngoProfile);
  await saveData(StorageKeys.USER_PROFILE, ngoProfile);
  await saveData(StorageKeys.AUTH_ROLE, "ngo");
  await logActivity({ uid: cred.user.uid, email, role: "ngo", action: "register", meta: { platform: Platform.OS } });
  return ngoProfile;
}

export async function loginNgo({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "ngos", cred.user.uid));
  const profile = snap.exists() ? snap.data() : { ngoId: cred.user.uid, email };
  await saveData(StorageKeys.USER_PROFILE, profile);
  await saveData(StorageKeys.AUTH_ROLE, "ngo");
  await logActivity({ uid: cred.user.uid, email, role: "ngo", action: "login", meta: { platform: Platform.OS } });
  return profile;
}

// Admin accounts are provisioned through Firebase Admin SDK, never by the client.
export async function loginAdmin({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "admins", cred.user.uid));
  if (!snap.exists()) {
    await signOut(auth);
    throw new Error("This account is not registered as an administrator.");
  }
  const profile = snap.data();
  await saveData(StorageKeys.USER_PROFILE, profile);
  await saveData(StorageKeys.AUTH_ROLE, "admin");
  await logActivity({ uid: cred.user.uid, email, role: "admin", action: "login", meta: { platform: Platform.OS } });
  return profile;
}

// ---------- SHARED ----------

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export async function logout() {
  // Capture who's logging out (and log the "logout" activity) *before*
  // we sign out and wipe the cache — afterwards auth.currentUser is null
  // and the cached profile is gone, so this is the last chance to do it.
  try {
    const cachedProfile = await getData(StorageKeys.USER_PROFILE);
    const cachedRole = await getData(StorageKeys.AUTH_ROLE);
    const uid = auth.currentUser?.uid || cachedProfile?.uid || cachedProfile?.ngoId;
    if (uid) {
      await logActivity({
        uid,
        email: cachedProfile?.email,
        role: cachedRole,
        action: "logout",
        meta: { platform: Platform.OS },
      });
    }
  } catch (e) {
    console.warn("logout activity log failed", e);
  }

  await signOut(auth);
  await removeData(StorageKeys.USER_PROFILE);
  await removeData(StorageKeys.AUTH_ROLE);
}
