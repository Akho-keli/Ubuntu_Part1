import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { fetchCampaignsByNgo } from "../../services/firestoreService";
import { logout } from "../../services/authService";

export default function NGODashboard({ navigation }) {
  const { colors } = useTheme();
  const { profile, user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    if (user) fetchCampaignsByNgo(user.uid).then(setCampaigns);
  }, [user]);

  const totalRaised = campaigns.reduce((s, c) => s + (c.raisedAmount || 0), 0);

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  const menu = [
    { icon: "📋", label: "My Campaigns", screen: "ManageCampaigns" },
    { icon: "➕", label: "New Campaign", screen: "CreateCampaign" },
    { icon: "🙋", label: "Volunteers", screen: "ManageVolunteers" },
    { icon: "📅", label: "Events", screen: "ManageEvents" },
    { icon: "📊", label: "Analytics", screen: "NGOAnalytics" },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.header}>
          <View>
            <Text style={{ color: colors.subtext, fontSize: 12 }}>NGO Partner</Text>
            <Text style={[styles.name, { color: colors.text }]}>{profile?.name || "Your NGO"}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout}><Text style={{ color: colors.danger, fontWeight: "800" }}>Logout</Text></TouchableOpacity>
        </View>

        {!profile?.verified && (
          <View style={styles.pendingBanner}>
            <Text style={{ color: "#92400E", fontSize: 12, fontWeight: "700" }}>
              ⏳ Your NGO is pending admin verification. Campaigns won't be public until approved.
            </Text>
          </View>
        )}

        <View style={[styles.statsCard, { backgroundColor: colors.primary }]}>
          <View>
            <Text style={styles.statLabel}>Total Raised</Text>
            <Text style={styles.statValue}>R{totalRaised}</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Campaigns</Text>
            <Text style={styles.statValue}>{campaigns.length}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {menu.map((item) => (
            <TouchableOpacity key={item.label} style={[styles.gridItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate(item.screen)}>
              <Text style={{ fontSize: 24 }}>{item.icon}</Text>
              <Text style={[styles.gridLabel, { color: colors.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  name: { fontSize: 18, fontWeight: "900" },
  pendingBanner: { backgroundColor: "#FEF3C7", borderRadius: 10, padding: 12, marginBottom: 16 },
  statsCard: { flexDirection: "row", justifyContent: "space-between", borderRadius: 16, padding: 20, marginBottom: 24 },
  statLabel: { color: "#E2FBEA", fontSize: 11, fontWeight: "700" },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: { width: "31%", borderRadius: 14, paddingVertical: 18, alignItems: "center" },
  gridLabel: { fontSize: 10, fontWeight: "800", marginTop: 6, textAlign: "center" },
});
