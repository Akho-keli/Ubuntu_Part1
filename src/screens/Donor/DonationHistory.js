import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { fetchDonationHistory } from "../../services/firestoreService";
import { EmptyState, LoadingOverlay } from "../../components/Feedback";

export default function DonationHistory({ navigation, route }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDonationHistory(user.uid).then(setDonations).finally(() => setLoading(false));
  }, [user]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: colors.accent, fontWeight: "800" }}>← Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>My Donations</Text>
      </View>

      {route?.params?.justDonated && (
        <View style={styles.successBanner}>
          <Text style={{ color: "#065F46", fontWeight: "800", fontSize: 12 }}>🎉 Thank you! Your donation was recorded.</Text>
        </View>
      )}

      {loading ? (
        <LoadingOverlay />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {donations.length === 0 ? (
            <EmptyState icon="🧾" title="No donations yet" subtitle="Your donation history will appear here." />
          ) : (
            donations.map((d) => (
              <View key={d.id} style={[styles.row, { backgroundColor: colors.card }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "800", fontSize: 14 }}>R{d.amount} {d.currency}</Text>
                  <Text style={{ color: colors.subtext, fontSize: 11, marginTop: 2 }}>Ref: {d.paymentRef}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: d.status === "success" ? "#DCFCE7" : "#FEF3C7" }]}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: d.status === "success" ? "#166534" : "#92400E" }}>{d.status}</Text>
                </View>
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
  successBanner: { backgroundColor: "#DCFCE7", marginHorizontal: 20, padding: 10, borderRadius: 10, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 14, marginBottom: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
});
