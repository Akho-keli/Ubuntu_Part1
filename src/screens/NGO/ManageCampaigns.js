import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { fetchCampaignsByNgo, deleteCampaign } from "../../services/firestoreService";
import { EmptyState, LoadingOverlay } from "../../components/Feedback";

const statusColors = { pending: "#FEF3C7", approved: "#DCFCE7", rejected: "#FEE2E2" };
const statusText = { pending: "#92400E", approved: "#166534", rejected: "#991B1B" };

export default function ManageCampaigns({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (user) fetchCampaignsByNgo(user.uid).then(setCampaigns).finally(() => setLoading(false));
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (id) => {
    Alert.alert("Delete campaign?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteCampaign(id); load(); } },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: colors.accent, fontWeight: "800" }}>← Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>My Campaigns</Text>
      </View>

      {loading ? (
        <LoadingOverlay />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {campaigns.length === 0 ? (
            <EmptyState icon="📋" title="No campaigns yet" subtitle="Create your first campaign to start raising funds." />
          ) : (
            campaigns.map((c) => (
              <View key={c.id} style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.rowTop}>
                  <Text style={{ color: colors.text, fontWeight: "800", fontSize: 14, flex: 1 }} numberOfLines={1}>{c.title}</Text>
                  <View style={[styles.pill, { backgroundColor: statusColors[c.status] || "#E2E8F0" }]}>
                    <Text style={{ fontSize: 10, fontWeight: "800", color: statusText[c.status] || "#334155" }}>{c.status}</Text>
                  </View>
                </View>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700", marginTop: 6 }}>R{c.raisedAmount || 0} / R{c.goalAmount}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleDelete(c.id)}>
                    <Text style={{ color: colors.danger, fontSize: 12, fontWeight: "800" }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate("CreateCampaign")}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>+ New Campaign</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: "900", marginTop: 10 },
  card: { borderRadius: 14, padding: 16, marginBottom: 14 },
  rowTop: { flexDirection: "row", alignItems: "center" },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  addBtn: { borderRadius: 12, padding: 16, alignItems: "center", marginTop: 6 },
});
