import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { fetchVolunteersByNgo, updateVolunteerStatus } from "../../services/firestoreService";
import { EmptyState, LoadingOverlay } from "../../components/Feedback";

const statusColors = { pending: "#FEF3C7", approved: "#DCFCE7", declined: "#FEE2E2" };
const statusText = { pending: "#92400E", approved: "#166534", declined: "#991B1B" };

export default function ManageVolunteers({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (user) fetchVolunteersByNgo(user.uid).then(setVolunteers).finally(() => setLoading(false));
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const setStatus = async (id, status) => {
    await updateVolunteerStatus(id, status);
    load();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.accent, fontWeight: "800" }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Volunteers</Text>
      </View>

      {loading ? (
        <LoadingOverlay />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {volunteers.length === 0 ? (
            <EmptyState icon="🙋" title="No applications yet" subtitle="Volunteer applications for your NGO will appear here." />
          ) : (
            volunteers.map((v) => (
              <View key={v.id} style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.topRow}>
                  <Text style={{ color: colors.text, fontWeight: "900", fontSize: 14 }}>{v.userName || "Volunteer"}</Text>
                  <View style={[styles.pill, { backgroundColor: statusColors[v.status] || "#E2E8F0" }]}>
                    <Text style={{ fontSize: 10, fontWeight: "800", color: statusText[v.status] || "#334155" }}>{v.status}</Text>
                  </View>
                </View>
                <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 6 }}>Skills: {v.skills}</Text>
                <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 2 }}>Availability: {v.availability}</Text>

                {v.status === "pending" && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity onPress={() => setStatus(v.id, "approved")} style={[styles.actionBtn, { backgroundColor: "#16A34A" }]}>
                      <Text style={styles.actionText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setStatus(v.id, "declined")} style={[styles.actionBtn, { backgroundColor: "#DC2626" }]}>
                      <Text style={styles.actionText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
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
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  actionText: { color: "#fff", fontWeight: "800", fontSize: 12 },
});
