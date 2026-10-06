import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fbLimit,
  increment,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { saveData, getData, StorageKeys } from "../utils/storage";

const col = (name) => collection(db, name);

// ============================================================
// CAMPAIGNS
// ============================================================
export async function createCampaign(data) {
  return addDoc(col("campaigns"), {
    ...data,
    raisedAmount: 0,
    status: "pending", // admin must approve
    featured: false,
    createdAt: serverTimestamp(),
  });
}

export async function updateCampaign(id, data) {
  return updateDoc(doc(db, "campaigns", id), data);
}

export async function deleteCampaign(id) {
  return deleteDoc(doc(db, "campaigns", id));
}

// Cache-first fetch: shows cached data instantly, then refreshes from
// Firestore and updates the cache — this is the app's offline support.
export async function fetchCampaigns({ onlyApproved = true } = {}) {
  const cached = await getData(StorageKeys.CACHED_CAMPAIGNS);
  try {
    const constraints = onlyApproved ? [where("status", "==", "approved")] : [];
    const q = query(col("campaigns"), ...constraints, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const campaigns = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    await saveData(StorageKeys.CACHED_CAMPAIGNS, campaigns);
    return { campaigns, fromCache: false };
  } catch (e) {
    if (cached) return { campaigns: cached, fromCache: true };
    throw e;
  }
}

export async function fetchCampaignsByNgo(ngoId) {
  const q = query(col("campaigns"), where("ngoId", "==", ngoId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribeToCampaign(campaignId, callback) {
  return onSnapshot(doc(db, "campaigns", campaignId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

// ============================================================
// DONATIONS
// ============================================================
export async function recordDonation({ userId, campaignId, ngoId, amount, currency, paymentRef, anonymous }) {
  const donationRef = await addDoc(col("donations"), {
    userId,
    campaignId,
    ngoId,
    amount,
    currency,
    paymentRef,
    anonymous: !!anonymous,
    status: "success",
    createdAt: serverTimestamp(),
  });

  // Keep campaign totals and donor lifetime totals in sync.
  await updateDoc(doc(db, "campaigns", campaignId), {
    raisedAmount: increment(amount),
  });
  await updateDoc(doc(db, "users", userId), {
    totalDonated: increment(amount),
  });

  return donationRef;
}

export async function fetchDonationHistory(userId) {
  const q = query(col("donations"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchAllDonations({ max = 200 } = {}) {
  const q = query(col("donations"), orderBy("createdAt", "desc"), fbLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribeToAllDonations(callback, { max = 200 } = {}) {
  const q = query(col("donations"), orderBy("createdAt", "desc"), fbLimit(max));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

// ============================================================
// VOLUNTEERS
// ============================================================
export async function registerVolunteer(data) {
  return addDoc(col("volunteers"), { ...data, status: "pending", createdAt: serverTimestamp() });
}

export async function fetchVolunteersByNgo(ngoId) {
  const q = query(col("volunteers"), where("ngoId", "==", ngoId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateVolunteerStatus(id, status) {
  return updateDoc(doc(db, "volunteers", id), { status });
}

// ============================================================
// EVENTS
// ============================================================
export async function createEvent(data) {
  return addDoc(col("events"), { ...data, attendees: [], createdAt: serverTimestamp() });
}

export async function fetchUpcomingEvents() {
  const q = query(col("events"), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ============================================================
// NGOs
// ============================================================
export async function fetchNgos({ onlyVerified = true } = {}) {
  const constraints = onlyVerified ? [where("verified", "==", true)] : [];
  const q = query(col("ngos"), ...constraints);
  const snap = await getDocs(q);
  const ngos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  await saveData(StorageKeys.CACHED_NGOS, ngos);
  return ngos;
}

// Used by CampaignDetails so a person-in-need can see/call the NGO behind
// a campaign and get directions to it, even when the campaign itself has
// no phone/location saved (older campaigns fall back to the NGO's own).
export async function fetchNgoById(ngoId) {
  if (!ngoId) return null;
  const snap = await getDoc(doc(db, "ngos", ngoId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function fetchAllNgosForAdmin() {
  const snap = await getDocs(col("ngos"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setNgoVerified(ngoId, verified) {
  return updateDoc(doc(db, "ngos", ngoId), { verified });
}

export function subscribeToAllNgos(callback) {
  return onSnapshot(col("ngos"), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ============================================================
// USERS (admin)
// ============================================================
export async function fetchAllUsers() {
  const snap = await getDocs(col("users"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Real-time version — the Admin Users tab uses this so a block/unblock,
// edit, or delete performed from *any* admin session (or device) is
// reflected instantly everywhere, without a manual refresh.
export function subscribeToAllUsers(callback) {
  return onSnapshot(col("users"), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function setUserBlocked(userId, blocked) {
  return updateDoc(doc(db, "users", userId), { blocked });
}

// Admin-side edit of a donor's own profile fields (name/phone). Role and
// account deletion are handled server-side by Cloud Functions (see
// src/services/adminService.js) since those touch Firebase Auth itself.
export async function adminUpdateUserProfile(userId, data) {
  return updateDoc(doc(db, "users", userId), data);
}

export async function deleteUserDoc(userId) {
  return deleteDoc(doc(db, "users", userId));
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export async function sendNotification({ userId = "broadcast", title, body }) {
  return addDoc(col("notifications"), {
    userId,
    title,
    body,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function fetchNotifications(userId) {
  const q = query(
    col("notifications"),
    where("userId", "in", [userId, "broadcast"]),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ============================================================
// REPORTS / MODERATION (admin)
// ============================================================
export async function fileReport(data) {
  return addDoc(col("reports"), { ...data, status: "open", createdAt: serverTimestamp() });
}

export async function fetchOpenReports() {
  const q = query(col("reports"), where("status", "==", "open"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function resolveReport(id) {
  return updateDoc(doc(db, "reports", id), { status: "resolved" });
}

// ============================================================
// AUDIT LOG (admin)
// ============================================================
export async function logAdminAction({ adminUid, action, targetId }) {
  return addDoc(col("auditLogs"), { adminUid, action, targetId, createdAt: serverTimestamp() });
}

export async function fetchAuditLogs() {
  const q = query(col("auditLogs"), orderBy("createdAt", "desc"), fbLimit(100));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ============================================================
// ACTIVITY LOGS — a real-time trail of every login, logout, and profile /
// data change made by *any* account (donor, NGO, or admin). Written from
// authService (login/logout) and from the specific screens that mutate a
// user's own data. The Admin "Activity" tab subscribes to this live.
// ============================================================
export async function logActivity({ uid, email, role, action, meta = null }) {
  try {
    await addDoc(col("activityLogs"), {
      uid, email: email || null, role: role || null, action, meta,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    // Never let logging failures break the actual user-facing action.
    console.warn("logActivity failed", e);
  }
}

export function subscribeToActivityLogs(callback, { max = 300 } = {}) {
  const q = query(col("activityLogs"), orderBy("createdAt", "desc"), fbLimit(max));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Real-time reports/campaigns are also useful for the live admin panel.
export function subscribeToReports(callback) {
  const q = query(col("reports"), where("status", "==", "open"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function subscribeToAllCampaigns(callback) {
  const q = query(col("campaigns"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
