import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet,
  TextInput, Alert, RefreshControl, StatusBar, Modal,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { logout } from "../../services/authService";
import { EmptyState, LoadingOverlay } from "../../components/Feedback";
import Input from "../../components/Input";
import Button from "../../components/Button";
import {
  subscribeToAllUsers, setUserBlocked, adminUpdateUserProfile, deleteUserDoc,
  subscribeToAllNgos, setNgoVerified,
  subscribeToAllCampaigns, updateCampaign, deleteCampaign,
  subscribeToAllDonations,
  subscribeToReports, resolveReport,
  sendNotification,
  logAdminAction, fetchAuditLogs,
  subscribeToActivityLogs,
} from "../../services/firestoreService";
import { adminCreateUser, adminDeleteUserAccount } from "../../services/adminService";

const colors = {
  bg: "#0F172A", sidebar: "#0B1120", card: "#FFFFFF", text: "#0F172A",
  subtext: "#64748B", primary: "#2563EB", accent: "#60A5FA",
  danger: "#DC2626", success: "#16A34A", warn: "#D97706",
  bgLight: "#F1F5F9", border: "#E2E8F0",
};

const SECTIONS = [
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "users", label: "Users", icon: "👥" },
  { key: "ngos", label: "NGOs", icon: "🏢" },
  { key: "campaigns", label: "Campaigns", icon: "📢" },
  { key: "donations", label: "Donations", icon: "💰" },
  { key: "reports", label: "Reports", icon: "🚩" },
  { key: "broadcast", label: "Broadcast", icon: "📣" },
  { key: "activity", label: "Activity", icon: "🟢" },
  { key: "audit", label: "Audit Log", icon: "🕒" },
];

const ACTION_LABELS = {
  login: "Logged in",
  logout: "Logged out",
  register: "Created account",
  profile_update: "Updated profile",
  campaign_create: "Created a campaign",
  campaign_call: "Called a campaign organizer",
  campaign_directions: "Requested directions",
  directions_voice_readout: "Played voice directions",
  directions_open_native_maps: "Opened Maps navigation",
};

export default function AdminDashboard({ navigation }) {
  const { profile, user } = useAuth();
  const [section, setSection] = useState("overview");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // These four are kept LIVE via onSnapshot for the whole time the admin
  // has this screen open — any block/verify/approve/report from *any*
  // admin session (or device) shows up here instantly, with no refresh.
  const [users, setUsers] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [reports, setReports] = useState([]);
  const [activity, setActivity] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  // ---------- User CRUD modal state ----------
  const [userModal, setUserModal] = useState(null); // { mode: "create"|"edit", data }
  const [userForm, setUserForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [savingUser, setSavingUser] = useState(false);

  // ---------- real-time subscriptions ----------
  useEffect(() => {
    const unsubUsers = subscribeToAllUsers((data) => { setUsers(data); setLoading(false); });
    const unsubNgos = subscribeToAllNgos(setNgos);
    const unsubCampaigns = subscribeToAllCampaigns(setCampaigns);
    const unsubDonations = subscribeToAllDonations(setDonations);
    const unsubReports = subscribeToReports(setReports);
    const unsubActivity = subscribeToActivityLogs(setActivity, { max: 300 });

    return () => {
      unsubUsers(); unsubNgos(); unsubCampaigns(); unsubDonations(); unsubReports(); unsubActivity();
    };
  }, []);

  const loadAuditLogs = useCallback(() => {
    fetchAuditLogs().then(setAuditLogs).catch(() => {});
  }, []);
  useEffect(() => { loadAuditLogs(); }, [loadAuditLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAuditLogs();
    setTimeout(() => setRefreshing(false), 500); // everything else is already live
  };

  const audit = (action, targetId) => logAdminAction({ adminUid: user?.uid, action, targetId }).catch(() => {});

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  // ---------- derived stats ----------
  const totalDonated = donations.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const verifiedNgos = ngos.filter((n) => n.verified).length;
  const pendingNgos = ngos.length - verifiedNgos;
  const pendingCampaigns = campaigns.filter((c) => c.status === "pending").length;
  const blockedUsers = users.filter((u2) => u2.blocked).length;

  // Rough "who's active right now" signal: for each account, look at their
  // most recent login/logout in the live activity feed — if the latest
  // one is a login with no logout after it, count them as online.
  const onlineCount = (() => {
    const latestByUid = {};
    for (const a of activity) {
      if ((a.action === "login" || a.action === "logout") && !latestByUid[a.uid]) {
        latestByUid[a.uid] = a.action;
      }
    }
    return Object.values(latestByUid).filter((a) => a === "login").length;
  })();

  // ---------- actions ----------
  const toggleBlockUser = (u2) => {
    const next = !u2.blocked;
    Alert.alert(
      next ? "Block user?" : "Unblock user?",
      `${u2.firstName || u2.email} will ${next ? "no longer be able to sign in" : "regain access"}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: next ? "Block" : "Unblock",
          style: next ? "destructive" : "default",
          onPress: async () => {
            await setUserBlocked(u2.id, next);
            audit(next ? "block_user" : "unblock_user", u2.id);
          },
        },
      ]
    );
  };

  const openCreateUser = () => {
    setUserForm({ firstName: "", lastName: "", email: "", phone: "", password: "" });
    setUserModal({ mode: "create" });
  };

  const openEditUser = (u2) => {
    setUserForm({ firstName: u2.firstName || "", lastName: u2.lastName || "", email: u2.email || "", phone: u2.phone || "", password: "" });
    setUserModal({ mode: "edit", data: u2 });
  };

  const saveUser = async () => {
    setSavingUser(true);
    try {
      if (userModal.mode === "create") {
        if (!userForm.firstName.trim() || !userForm.email.trim() || userForm.password.length < 6) {
          Alert.alert("Missing info", "First name, email and a password (6+ characters) are required.");
          setSavingUser(false);
          return;
        }
        await adminCreateUser({
          firstName: userForm.firstName.trim(),
          lastName: userForm.lastName.trim(),
          email: userForm.email.trim(),
          phone: userForm.phone.trim(),
          password: userForm.password,
        });
      } else {
        await adminUpdateUserProfile(userModal.data.id, {
          firstName: userForm.firstName.trim(),
          lastName: userForm.lastName.trim(),
          phone: userForm.phone.trim(),
        });
        audit("edit_user", userModal.data.id);
      }
      setUserModal(null);
    } catch (e) {
      Alert.alert("Couldn't save", e.message || "Something went wrong.");
    } finally {
      setSavingUser(false);
    }
  };

  const removeUser = (u2) => {
    Alert.alert(
      "Delete user?",
      `This permanently deletes ${u2.firstName || u2.email}'s login and profile. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await adminDeleteUserAccount(u2.id); // deletes Auth account + Firestore doc via Cloud Function
            } catch (e) {
              // Cloud Functions not deployed yet (dev/offline) — fall back
              // to at least removing the Firestore profile so the admin
              // action still takes effect locally.
              await deleteUserDoc(u2.id);
            }
            audit("delete_user", u2.id);
          },
        },
      ]
    );
  };

  const toggleVerifyNgo = async (ngo) => {
    const next = !ngo.verified;
    await setNgoVerified(ngo.id, next);
    audit(next ? "verify_ngo" : "unverify_ngo", ngo.id);
  };

  const moderateCampaign = async (campaign, status) => {
    await updateCampaign(campaign.id, { status });
    audit(`campaign_${status}`, campaign.id);
  };

  const removeCampaign = (campaign) => {
    Alert.alert("Delete campaign?", `"${campaign.title}" will be permanently removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await deleteCampaign(campaign.id);
          audit("delete_campaign", campaign.id);
        },
      },
    ]);
  };

  const closeReport = async (report) => {
    await resolveReport(report.id);
    audit("resolve_report", report.id);
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
    setSendingBroadcast(true);
    try {
      await sendNotification({ userId: "broadcast", title: broadcastTitle.trim(), body: broadcastBody.trim() });
      audit("broadcast_notification", "all_users");
      setBroadcastTitle(""); setBroadcastBody("");
      setBroadcastSent(true);
      setTimeout(() => setBroadcastSent(false), 2500);
    } finally {
      setSendingBroadcast(false);
    }
  };

  const q = search.trim().toLowerCase();

  const formatTime = (ts) => {
    if (!ts?.toDate) return "just now";
    const d = ts.toDate();
    return d.toLocaleString();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.sidebar} />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>ADMIN PORTAL · LIVE</Text>
          <Text style={styles.headerTitle}>Welcome, {profile?.firstName || "Admin"}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* SECTION TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {SECTIONS.map((s) => (
          <TouchableOpacity
            key={s.key}
            onPress={() => setSection(s.key)}
            style={[styles.tab, section === s.key && styles.tabActive]}
          >
            <Text style={{ fontSize: 14 }}>{s.icon}</Text>
            <Text style={[styles.tabText, section === s.key && styles.tabTextActive]}>{s.label}</Text>
            {s.key === "ngos" && pendingNgos > 0 && <Badge count={pendingNgos} />}
            {s.key === "campaigns" && pendingCampaigns > 0 && <Badge count={pendingCampaigns} />}
            {s.key === "reports" && reports.length > 0 && <Badge count={reports.length} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <LoadingOverlay label="Loading admin data..." />
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {/* ================= OVERVIEW ================= */}
          {section === "overview" && (
            <>
              <View style={styles.statsGrid}>
                <StatCard label="Total Users" value={users.length} icon="👥" />
                <StatCard label="Active Now (est.)" value={onlineCount} icon="🟢" />
                <StatCard label="Verified NGOs" value={`${verifiedNgos}/${ngos.length}`} icon="🏢" />
                <StatCard label="Live Campaigns" value={campaigns.filter((c) => c.status === "approved").length} icon="📢" />
                <StatCard label="Total Raised" value={`R${totalDonated.toLocaleString()}`} icon="💰" />
                <StatCard label="Open Reports" value={reports.length} icon="🚩" warn={reports.length > 0} />
                <StatCard label="Blocked Users" value={blockedUsers} icon="⛔" warn={blockedUsers > 0} />
              </View>

              <Text style={styles.sectionHeading}>Needs Your Attention</Text>
              {pendingNgos === 0 && pendingCampaigns === 0 && reports.length === 0 ? (
                <EmptyState icon="✅" title="All caught up" subtitle="No pending approvals or reports right now." />
              ) : (
                <>
                  {pendingNgos > 0 && (
                    <AttentionRow icon="🏢" text={`${pendingNgos} NGO(s) awaiting verification`} onPress={() => setSection("ngos")} />
                  )}
                  {pendingCampaigns > 0 && (
                    <AttentionRow icon="📢" text={`${pendingCampaigns} campaign(s) awaiting approval`} onPress={() => setSection("campaigns")} />
                  )}
                  {reports.length > 0 && (
                    <AttentionRow icon="🚩" text={`${reports.length} open report(s)`} onPress={() => setSection("reports")} />
                  )}
                </>
              )}

              <Text style={styles.sectionHeading}>Live Activity</Text>
              {activity.slice(0, 5).map((a) => (
                <View key={a.id} style={styles.listRow}>
                  <Text style={styles.listRowTitle}>{a.email || a.uid} — {ACTION_LABELS[a.action] || a.action}</Text>
                  <Text style={styles.listRowSub}>{a.role} · {formatTime(a.createdAt)}</Text>
                </View>
              ))}
              {activity.length === 0 && <EmptyState icon="🟢" title="No activity yet" />}
            </>
          )}

          {/* ================= USERS ================= */}
          {section === "users" && (
            <>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                <SearchBox value={search} onChangeText={setSearch} placeholder="Search users by name or email..." style={{ flex: 1, marginBottom: 0 }} />
                <TouchableOpacity onPress={openCreateUser} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.actionBtnTextLight}>+ Add</Text>
                </TouchableOpacity>
              </View>
              {users
                .filter((u2) => `${u2.firstName || ""} ${u2.lastName || ""} ${u2.email || ""}`.toLowerCase().includes(q))
                .map((u2) => (
                  <View key={u2.id} style={styles.cardStacked}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardTitle}>{u2.firstName} {u2.lastName}</Text>
                      <Pill text={u2.blocked ? "Blocked" : "Active"} tone={u2.blocked ? "danger" : "success"} />
                    </View>
                    <Text style={styles.cardSub}>{u2.email}</Text>
                    <Text style={styles.cardMeta}>Donated: R{u2.totalDonated || 0} · Phone: {u2.phone || "—"}</Text>
                    <View style={styles.actionsRow}>
                      <TouchableOpacity onPress={() => openEditUser(u2)} style={[styles.actionBtn, { backgroundColor: colors.bgLight }]}>
                        <Text style={{ color: colors.text, fontWeight: "800", fontSize: 12 }}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => toggleBlockUser(u2)} style={[styles.actionBtn, { backgroundColor: colors.bgLight }]}>
                        <Text style={{ color: u2.blocked ? colors.success : colors.warn, fontWeight: "800", fontSize: 12 }}>
                          {u2.blocked ? "Unblock" : "Block"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeUser(u2)} style={[styles.actionBtn, { backgroundColor: colors.danger }]}>
                        <Text style={styles.actionBtnTextLight}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              {users.length === 0 && <EmptyState icon="👥" title="No users yet" />}
            </>
          )}

          {/* ================= NGOs ================= */}
          {section === "ngos" && (
            <>
              <SearchBox value={search} onChangeText={setSearch} placeholder="Search NGOs..." />
              {ngos
                .filter((n) => (n.name || "").toLowerCase().includes(q))
                .map((n) => (
                  <View key={n.id} style={styles.cardStacked}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardTitle}>{n.name}</Text>
                      <Pill text={n.verified ? "Verified" : "Pending"} tone={n.verified ? "success" : "warn"} />
                    </View>
                    <Text style={styles.cardSub}>{n.email} · {n.category}</Text>
                    <Text style={styles.cardMeta} numberOfLines={2}>{n.description}</Text>
                    <View style={styles.actionsRow}>
                      <TouchableOpacity onPress={() => toggleVerifyNgo(n)} style={[styles.actionBtn, { backgroundColor: n.verified ? colors.bgLight : colors.primary }]}>
                        <Text style={{ color: n.verified ? colors.text : "#fff", fontWeight: "800", fontSize: 12 }}>
                          {n.verified ? "Revoke Verification" : "Verify NGO"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              {ngos.length === 0 && <EmptyState icon="🏢" title="No NGOs registered yet" />}
            </>
          )}

          {/* ================= CAMPAIGNS ================= */}
          {section === "campaigns" && (
            <>
              <SearchBox value={search} onChangeText={setSearch} placeholder="Search campaigns..." />
              {campaigns
                .filter((c) => (c.title || "").toLowerCase().includes(q))
                .map((c) => (
                  <View key={c.id} style={styles.cardStacked}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{c.title}</Text>
                      <Pill
                        text={c.status}
                        tone={c.status === "approved" ? "success" : c.status === "rejected" ? "danger" : "warn"}
                      />
                    </View>
                    <Text style={styles.cardSub}>{c.ngoName || c.ngoId} · {c.category}</Text>
                    <Text style={styles.cardMeta}>R{c.raisedAmount || 0} raised of R{c.goalAmount}</Text>
                    {c.contactPhone ? <Text style={styles.cardMeta}>📞 {c.contactPhone}</Text> : null}
                    {c.location?.address ? <Text style={styles.cardMeta}>📍 {c.location.address}</Text> : null}
                    <View style={styles.actionsRow}>
                      {c.status !== "approved" && (
                        <TouchableOpacity onPress={() => moderateCampaign(c, "approved")} style={[styles.actionBtn, { backgroundColor: colors.success }]}>
                          <Text style={styles.actionBtnTextLight}>Approve</Text>
                        </TouchableOpacity>
                      )}
                      {c.status !== "rejected" && (
                        <TouchableOpacity onPress={() => moderateCampaign(c, "rejected")} style={[styles.actionBtn, { backgroundColor: colors.warn }]}>
                          <Text style={styles.actionBtnTextLight}>Reject</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => removeCampaign(c)} style={[styles.actionBtn, { backgroundColor: colors.danger }]}>
                        <Text style={styles.actionBtnTextLight}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              {campaigns.length === 0 && <EmptyState icon="📢" title="No campaigns submitted yet" />}
            </>
          )}

          {/* ================= DONATIONS ================= */}
          {section === "donations" && (
            <>
              <View style={styles.statsGrid}>
                <StatCard label="Total Raised" value={`R${totalDonated.toLocaleString()}`} icon="💰" />
                <StatCard label="Transactions" value={donations.length} icon="🧾" />
              </View>
              {donations.map((d) => (
                <View key={d.id} style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>R{d.amount} {d.currency}</Text>
                    <Text style={styles.cardSub}>{d.anonymous ? "Anonymous" : d.userId} → campaign {d.campaignId}</Text>
                    <Text style={styles.cardMeta}>Ref: {d.paymentRef}</Text>
                  </View>
                  <Pill text={d.status} tone={d.status === "success" ? "success" : "warn"} />
                </View>
              ))}
              {donations.length === 0 && <EmptyState icon="💰" title="No donations recorded yet" />}
            </>
          )}

          {/* ================= REPORTS ================= */}
          {section === "reports" && (
            <>
              {reports.map((r) => (
                <View key={r.id} style={styles.cardStacked}>
                  <Text style={styles.cardTitle}>{r.type || "Report"}</Text>
                  <Text style={styles.cardSub}>Reported by: {r.reportedBy}</Text>
                  <Text style={styles.cardMeta}>{r.reason}</Text>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity onPress={() => closeReport(r)} style={[styles.actionBtn, { backgroundColor: colors.success }]}>
                      <Text style={styles.actionBtnTextLight}>Mark Resolved</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {reports.length === 0 && <EmptyState icon="✅" title="No open reports" subtitle="The community is behaving nicely." />}
            </>
          )}

          {/* ================= BROADCAST ================= */}
          {section === "broadcast" && (
            <View style={styles.cardStacked}>
              <Text style={styles.cardTitle}>Send a Platform-Wide Notification</Text>
              <Text style={styles.cardSub}>Delivered as an in-app + push notification to every user.</Text>
              <TextInput
                placeholder="Title"
                value={broadcastTitle}
                onChangeText={setBroadcastTitle}
                style={styles.input}
              />
              <TextInput
                placeholder="Message"
                value={broadcastBody}
                onChangeText={setBroadcastBody}
                style={[styles.input, { height: 90, textAlignVertical: "top" }]}
                multiline
              />
              {broadcastSent && <Text style={{ color: colors.success, fontWeight: "800", marginBottom: 10 }}>✓ Broadcast sent</Text>}
              <TouchableOpacity
                onPress={handleBroadcast}
                disabled={sendingBroadcast || !broadcastTitle.trim() || !broadcastBody.trim()}
                style={[styles.actionBtn, { backgroundColor: colors.primary, alignSelf: "flex-start", opacity: sendingBroadcast ? 0.6 : 1 }]}
              >
                <Text style={styles.actionBtnTextLight}>{sendingBroadcast ? "Sending..." : "Send Broadcast"}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ================= ACTIVITY (live login/logout/change trail) ================= */}
          {section === "activity" && (
            <>
              <Text style={{ color: colors.subtext, fontSize: 12, marginBottom: 12 }}>
                Real-time trail of every login, logout, and change made by any account. Updates instantly — no refresh needed.
              </Text>
              <SearchBox value={search} onChangeText={setSearch} placeholder="Search by name or email..." />
              {activity
                .filter((a) => (a.email || a.uid || "").toLowerCase().includes(q))
                .map((a) => (
                  <View key={a.id} style={styles.listRow}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={styles.listRowTitle}>{a.email || a.uid}</Text>
                      <Pill
                        text={a.action === "login" ? "Login" : a.action === "logout" ? "Logout" : "Change"}
                        tone={a.action === "login" ? "success" : a.action === "logout" ? "warn" : "warn"}
                      />
                    </View>
                    <Text style={styles.listRowSub}>{ACTION_LABELS[a.action] || a.action} · {a.role || "—"}</Text>
                    <Text style={styles.listRowSub}>{formatTime(a.createdAt)}</Text>
                  </View>
                ))}
              {activity.length === 0 && <EmptyState icon="🟢" title="No activity logged yet" />}
            </>
          )}

          {/* ================= AUDIT LOG (admin actions only) ================= */}
          {section === "audit" && (
            <>
              {auditLogs.map((log) => (
                <View key={log.id} style={styles.listRow}>
                  <Text style={styles.listRowTitle}>{log.action}</Text>
                  <Text style={styles.listRowSub}>Target: {log.targetId} · Admin: {log.adminUid}</Text>
                </View>
              ))}
              {auditLogs.length === 0 && <EmptyState icon="🕒" title="No admin actions logged yet" />}
            </>
          )}
        </ScrollView>
      )}

      {/* ================= ADD / EDIT USER MODAL ================= */}
      <Modal visible={!!userModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{userModal?.mode === "create" ? "Add New User" : "Edit User"}</Text>
            <View style={{ flexDirection: "row" }}>
              <Input label="First Name" value={userForm.firstName} onChangeText={(t) => setUserForm((p) => ({ ...p, firstName: t }))} style={{ flex: 1, marginRight: 8 }} />
              <Input label="Last Name" value={userForm.lastName} onChangeText={(t) => setUserForm((p) => ({ ...p, lastName: t }))} style={{ flex: 1 }} />
            </View>
            <Input
              label="Email"
              value={userForm.email}
              onChangeText={(t) => setUserForm((p) => ({ ...p, email: t }))}
              editable={userModal?.mode === "create"}
              style={userModal?.mode !== "create" ? { opacity: 0.6 } : null}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input label="Phone" value={userForm.phone} onChangeText={(t) => setUserForm((p) => ({ ...p, phone: t }))} keyboardType="phone-pad" />
            {userModal?.mode === "create" && (
              <Input label="Temporary Password" value={userForm.password} onChangeText={(t) => setUserForm((p) => ({ ...p, password: t }))} secureTextEntry />
            )}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <Button title="Cancel" variant="outline" onPress={() => setUserModal(null)} style={{ flex: 1 }} />
              <Button title={userModal?.mode === "create" ? "Create User" : "Save Changes"} onPress={saveUser} loading={savingUser} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------- small presentational helpers ----------
function StatCard({ label, value, icon, warn }) {
  return (
    <View style={[styles.statCard, warn && { borderColor: colors.warn, borderWidth: 1.5 }]}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Pill({ text, tone }) {
  const map = {
    success: { bg: "#DCFCE7", fg: "#166534" },
    warn: { bg: "#FEF3C7", fg: "#92400E" },
    danger: { bg: "#FEE2E2", fg: "#991B1B" },
  };
  const c = map[tone] || map.warn;
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={{ color: c.fg, fontSize: 10, fontWeight: "900", textTransform: "capitalize" }}>{text}</Text>
    </View>
  );
}

function Badge({ count }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count}</Text>
    </View>
  );
}

function SearchBox({ style, ...props }) {
  return <TextInput placeholderTextColor={colors.subtext} style={[styles.searchBox, style]} {...props} />;
}

function AttentionRow({ icon, text, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.attentionRow}>
      <Text style={{ fontSize: 18, marginRight: 10 }}>{icon}</Text>
      <Text style={{ flex: 1, color: "#92400E", fontWeight: "700", fontSize: 12 }}>{text}</Text>
      <Text style={{ color: "#92400E", fontWeight: "900" }}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  headerEyebrow: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  headerTitle: { color: "#fff", fontSize: 19, fontWeight: "900", marginTop: 4 },
  logoutBtn: { backgroundColor: "rgba(220,38,38,0.15)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  logoutText: { color: "#F87171", fontWeight: "800", fontSize: 12 },

  tabsRow: { flexGrow: 0, marginBottom: 4 },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, marginRight: 8,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: "#CBD5E1", fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: "#fff" },

  body: { flex: 1, backgroundColor: colors.bgLight, borderTopLeftRadius: 24, borderTopRightRadius: 24 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  statCard: { width: "31%", backgroundColor: "#fff", borderRadius: 14, padding: 14, alignItems: "flex-start" },
  statValue: { fontSize: 18, fontWeight: "900", color: colors.text, marginTop: 6 },
  statLabel: { fontSize: 10, color: colors.subtext, marginTop: 2, fontWeight: "700" },

  sectionHeading: { fontSize: 15, fontWeight: "900", color: colors.text, marginTop: 8, marginBottom: 10 },

  searchBox: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    height: 46, paddingHorizontal: 14, marginBottom: 16, color: colors.text,
  },

  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, gap: 8 },
  cardStacked: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardTitle: { color: colors.text, fontWeight: "900", fontSize: 14, flex: 1 },
  cardSub: { color: colors.subtext, fontSize: 12, marginTop: 2 },
  cardMeta: { color: colors.subtext, fontSize: 11, marginTop: 4 },

  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  actionBtnTextLight: { color: "#fff", fontWeight: "800", fontSize: 12 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 6 },

  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badge: { backgroundColor: "#EF4444", borderRadius: 10, paddingHorizontal: 6, marginLeft: 4, justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },

  listRow: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10 },
  listRowTitle: { color: colors.text, fontWeight: "800", fontSize: 13 },
  listRowSub: { color: colors.subtext, fontSize: 11, marginTop: 3 },

  attentionRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7",
    borderRadius: 12, padding: 14, marginBottom: 10,
  },

  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14,
    height: 48, marginBottom: 12, color: colors.text,
  },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: colors.text, marginBottom: 14 },
});
