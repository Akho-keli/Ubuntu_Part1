// ============================================================
// FIREBASE CONFIG
// Fill these in from Firebase Console > Project Settings > SDK config
// (or wire them to your .env via a tool like react-native-dotenv / expo-constants).
// ============================================================
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDV-C4W4Q6caKhkCN3LZmp4HOSUvVBg3mg",
  authDomain: "buntucare-78af5.firebaseapp.com",
  projectId: "buntucare-78af5",
  storageBucket: "buntucare-78af5.firebasestorage.app",
  messagingSenderId: "700737274476",
  appId: "1:700737274476:web:ee76c90c886eb15714ce49"
};


const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth persists the session in AsyncStorage so users stay logged in
// between app restarts (React Native has no window.localStorage).
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // initializeAuth throws if already initialized (e.g. fast refresh) — reuse it.
  auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);
// Used to call the admin-only Cloud Functions (adminCreateUser, adminDeleteUser)
// that need the Admin SDK — see src/services/adminService.js.
const functionsClient = getFunctions(app);

export { app, auth, db, storage, functionsClient };

/*
  ============================================================
  FIRESTORE COLLECTION SCHEMA (create these via the app — Firestore
  creates collections automatically the first time you write to them)
  ============================================================
  users/{uid}            -> { firstName, lastName, email, phone, role: "donor",
                               photoURL, createdAt, fcmToken, totalDonated }
  ngos/{ngoId}            -> { name, email, registrationNumber, description,
                               category, logoURL, verified: bool, ownerUid,
                               location: {lat,lng,address}, createdAt }
  campaigns/{campaignId}  -> { ngoId, title, description, category, goalAmount,
                               raisedAmount, imageURL, status: "pending|approved|rejected",
                               featured: bool, createdAt, deadline,
                               contactPhone, location: {lat,lng,address} }
  donations/{donationId}  -> { userId, campaignId, ngoId, amount, currency,
                               paymentRef, status: "success|pending|failed",
                               anonymous: bool, createdAt }
  volunteers/{id}         -> { userId, ngoId, skills, availability, status, createdAt }
  events/{eventId}        -> { ngoId, title, description, date, location, attendees: [uid] }
  notifications/{id}      -> { userId | "broadcast", title, body, read, createdAt }
  admins/{uid}            -> { firstName, lastName, email, department, role: "admin|superadmin" }
  reports/{id}            -> { type, targetId, reason, reportedBy, status, createdAt }
  auditLogs/{id}          -> { adminUid, action, targetId, createdAt }
  activityLogs/{id}       -> { uid, email, role, action: "login|logout|profile_update|...",
                               platform, meta, createdAt }
                             Written by every account on login/logout/change so the
                             admin Activity tab can show a real-time trail per user.
  ============================================================
  Deploy firestore.rules from the project root; do not replace it with a
  permissive sample here. Admin documents must be provisioned with Admin SDK.
  ============================================================
*/
