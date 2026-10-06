import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { BarChart } from "react-native-chart-kit";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { fetchCampaignsByNgo } from "../../services/firestoreService";
import { EmptyState, LoadingOverlay } from "../../components/Feedback";

const screenWidth = Dimensions.get("window").width;

export default function NGOAnalytics({ navigation }) {
  const { colors, mode } = useTheme();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (user) fetchCampaignsByNgo(user.uid).then(setCampaigns).finally(() => setLoading(false));
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalRaised = campaigns.reduce((s, c) => s + (c.raisedAmount || 0), 0);
  const totalGoal = campaigns.reduce((s, c) => s + (c.goalAmount || 0), 0);
  const avgProgress = totalGoal ? Math.round((totalRaised / totalGoal) * 100) : 0;

  const chartData = {
    labels: campaigns.slice(0, 5).map((c) => (c.title || "").slice(0, 8)),
    datasets: [{ data: campaigns.slice(0, 5).map((c) => c.raisedAmount || 0) }],
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.accent, fontWeight: "800" }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Analytics</Text>
      </View>

      {loading ? (
        <LoadingOverlay />
      ) : campaigns.length === 0 ? (
        <EmptyState icon="📊" title="Nothing to analyze yet" subtitle="Create a campaign to see performance data here." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: "700" }}>Total Raised</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>R{totalRaised}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: "700" }}>Avg. Progress</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>{avgProgress}%</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: "700" }}>Campaigns</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>{campaigns.length}</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Funds Raised by Campaign</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <BarChart
              data={chartData}
              width={screenWidth - 72}
              height={220}
              fromZero
              yAxisLabel="R"
              yAxisSuffix=""
              chartConfig={{
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: () => colors.primary,
                labelColor: () => colors.subtext,
                barPercentage: 0.6,
              }}
              style={{ borderRadius: 12 }}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Campaign Breakdown</Text>
          {campaigns.map((c) => {
            const pct = c.goalAmount ? Math.min(100, Math.round((c.raisedAmount / c.goalAmount) * 100)) : 0;
            return (
              <View key={c.id} style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={{ color: colors.text, fontWeight: "800", fontSize: 13 }} numberOfLines={1}>{c.title}</Text>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
                </View>
                <Text style={{ color: colors.subtext, fontSize: 11, marginTop: 6 }}>R{c.raisedAmount || 0} of R{c.goalAmount} · {pct}%</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: "900", marginTop: 10 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 14, padding: 14 },
  statValue: { fontSize: 18, fontWeight: "900", marginTop: 6 },
  sectionTitle: { fontSize: 15, fontWeight: "900", marginBottom: 10, marginTop: 4 },
  chartCard: { borderRadius: 16, padding: 10, alignItems: "center", marginBottom: 20 },
  card: { borderRadius: 12, padding: 14, marginBottom: 10 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden", marginTop: 8 },
  progressFill: { height: "100%", borderRadius: 3 },
});
