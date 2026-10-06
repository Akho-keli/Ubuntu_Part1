import { httpsCallable } from "firebase/functions";
import { functionsClient } from "../firebase/firebaseConfig";

// ============================================================
// ADMIN USER CRUD (Auth + Firestore together)
// The Firebase client SDK can only ever manage the *currently signed-in*
// account, so an admin can't create or delete somebody else's Auth
// account directly from the app — that has to go through a Cloud
// Function running the Admin SDK (see functions/index.js). These two
// helpers are the client-side entry points for that.
//
// Read/update/block are still plain Firestore calls (see
// firestoreService.js: subscribeToAllUsers, adminUpdateUserProfile,
// setUserBlocked) since those don't touch Firebase Auth itself.
// ============================================================

export async function adminCreateUser({ firstName, lastName, email, phone, password }) {
  const call = httpsCallable(functionsClient, "adminCreateUser");
  const res = await call({ firstName, lastName, email, phone, password });
  return res.data; // { uid }
}

export async function adminDeleteUserAccount(uid) {
  const call = httpsCallable(functionsClient, "adminDeleteUser");
  const res = await call({ uid });
  return res.data; // { deleted: true }
}
