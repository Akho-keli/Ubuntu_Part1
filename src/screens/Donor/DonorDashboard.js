import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { fetchCampaigns, fetchDonationHistory } from "../../services/firestoreService";
import { registerForPushNotifications } from "../../services/notificationService";
import { logout } from "../../services/authService";

export default function DonorDashboard({ navigation }) {
  const { colors } = useTheme();
  const { profile, user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [donationCount, setDonationCount] = useState(0);

  useEffect(() => {
    fetchCampaigns({ onlyApproved: true }).then(({ campaigns }) => setCampaigns(campaigns.slice(0, 5)));
    if (user) {
      fetchDonationHistory(user.uid).then((d) => setDonationCount(d.length));
      registerForPushNotifications(user.uid, "users");
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  const menu = [
    { icon: "💚", label: "Browse Campaigns", screen: "Home" },
    { icon: "🧾", label: "My Donations", screen: "DonationHistory" },
    { icon: "🙌", label: "Volunteer", screen: "Volunteer" },
    { icon: "📅", label: "Events", screen: "Events" },
    { icon: "🔎", label: "Find NGOs", screen: "SearchNGOs" },
    { icon: "🔔", label: "Notifications", screen: "Notifications" },
    { icon: "👤", label: "Profile", screen: "Profile" },
    { icon: "⚙️", label: "Settings", screen: "Settings" },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.header}>
          <View>
            <Text style={{ color: colors.subtext, fontSize: 12 }}>Welcome back,</Text>
            <Text style={[styles.name, { color: colors.text }]}>{profile?.firstName || "Donor"} 👋</Text>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={{ color: colors.danger, fontWeight: "800" }}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.statsCard, { backgroundColor: colors.primary }]}>
          <View>
            <Text style={styles.statLabel}>Total Donated</Text>
            <Text style={styles.statValue}>R{profile?.totalDonated || 0}</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Donations Made</Text>
            <Text style={styles.statValue}>{donationCount}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Access</Text>
        <View style={styles.grid}>
          {menu.map((item) => (
            <TouchableOpacity key={item.label} style={[styles.gridItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate(item.screen)}>
              <Text style={{ fontSize: 24 }}>{item.icon}</Text>
              <Text style={[styles.gridLabel, { color: colors.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested Campaigns</Text>
        {campaigns.map((c) => (
          <TouchableOpacity key={c.id} style={[styles.campaignRow, { backgroundColor: colors.card }]} onPress={() => navigation.navigate("CampaignDetails", { campaignId: c.id })}>
            <Text style={{ color: colors.text, fontWeight: "800", fontSize: 13 }} numberOfLines={1}>{c.title}</Text>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700", marginTop: 4 }}>R{c.raisedAmount || 0} / R{c.goalAmount}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  name: { fontSize: 20, fontWeight: "900" },
  statsCard: { flexDirection: "row", justifyContent: "space-between", borderRadius: 16, padding: 20, marginBottom: 24 },
  statLabel: { color: "#E2FBEA", fontSize: 11, fontWeight: "700" },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "900", marginBottom: 12, marginTop: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  gridItem: { width: "31%", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  gridLabel: { fontSize: 10, fontWeight: "800", marginTop: 6, textAlign: "center" },
  campaignRow: { borderRadius: 12, padding: 14, marginBottom: 10 },
});
