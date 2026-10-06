import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet,
  Image, RefreshControl, StatusBar,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fetchCampaigns } from "../../services/firestoreService";
import { EmptyState } from "../../components/Feedback";

export default function Home({ navigation }) {
  const { colors } = useTheme();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    try {
      const { campaigns: data, fromCache } = await fetchCampaigns({ onlyApproved: true });
      setCampaigns(data);
      setOffline(fromCache);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === "#0B1120" ? "light-content" : "dark-content"} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
              <Text style={{ color: "#fff", fontSize: 18 }}>♥</Text>
            </View>
            <Text style={[styles.logoText, { color: colors.text }]}>
              Ubuntu<Text style={{ color: colors.primary }}>Care</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={{ color: colors.accent, fontWeight: "800" }}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {offline && (
          <View style={styles.offlineBanner}>
            <Text style={{ color: "#92400E", fontSize: 11 }}>📡 Showing cached data — you're offline.</Text>
          </View>
        )}

        {/* HERO */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroTitle}>Small acts, big change.</Text>
          <Text style={styles.heroSubtitle}>Donate to verified NGOs, volunteer your time, and track your impact.</Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity style={styles.heroBtnPrimary} onPress={() => navigation.navigate("Register")}>
              <Text style={styles.heroBtnPrimaryText}>Start Donating</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroBtnOutline} onPress={() => navigation.navigate("NGORegister")}>
              <Text style={styles.heroBtnOutlineText}>Register your NGO</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.quickActions}>
          {[
            { icon: "🔎", label: "Find NGOs", screen: "SearchNGOs" },
            { icon: "🙌", label: "Volunteer", screen: "Volunteer" },
            { icon: "📅", label: "Events", screen: "Events" },
            { icon: "🔐", label: "Admin", screen: "AdminLogin" },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={[styles.quickCard, { backgroundColor: colors.card }]} onPress={() => navigation.navigate(item.screen)}>
              <Text style={{ fontSize: 22 }}>{item.icon}</Text>
              <Text style={[styles.quickLabel, { color: colors.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CAMPAIGNS */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Campaigns</Text>

        {loading ? (
          <Text style={{ color: colors.subtext, paddingHorizontal: 20 }}>Loading campaigns...</Text>
        ) : campaigns.length === 0 ? (
          <EmptyState icon="🌍" title="No campaigns yet" subtitle="Check back soon, or register your NGO to start one." />
        ) : (
          campaigns.map((c) => {
            const pct = c.goalAmount ? Math.min(100, Math.round((c.raisedAmount / c.goalAmount) * 100)) : 0;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.campaignCard, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate("CampaignDetails", { campaignId: c.id })}
              >
                {c.imageURL ? (
                  <Image source={{ uri: c.imageURL }} style={styles.campaignImage} />
                ) : (
                  <View style={[styles.campaignImage, { backgroundColor: colors.border, justifyContent: "center", alignItems: "center" }]}>
                    <Text style={{ fontSize: 30 }}>🖼️</Text>
                  </View>
                )}
                <View style={{ padding: 14 }}>
                  <Text style={[styles.campaignTitle, { color: colors.text }]} numberOfLines={1}>{c.title}</Text>
                  <Text style={[styles.campaignDesc, { color: colors.subtext }]} numberOfLines={2}>{c.description}</Text>
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
                  </View>
                  <View style={styles.campaignFooter}>
                    <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 12 }}>R{c.raisedAmount || 0} raised</Text>
                    <Text style={{ color: colors.subtext, fontSize: 11 }}>Goal: R{c.goalAmount}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 30 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logoCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 8 },
  logoText: { fontSize: 18, fontWeight: "900" },
  offlineBanner: { backgroundColor: "#FEF3C7", marginHorizontal: 20, padding: 8, borderRadius: 8, marginBottom: 10 },
  hero: { margin: 20, borderRadius: 20, padding: 24 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "900", marginBottom: 8 },
  heroSubtitle: { color: "#E2FBEA", fontSize: 13, lineHeight: 19, marginBottom: 18 },
  heroButtons: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  heroBtnPrimary: { backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  heroBtnPrimaryText: { fontWeight: "900", color: "#0B7A3B" },
  heroBtnOutline: { borderWidth: 1.5, borderColor: "#fff", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  heroBtnOutlineText: { fontWeight: "900", color: "#fff" },
  quickActions: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 15, gap: 10, marginBottom: 20 },
  quickCard: { width: "46%", borderRadius: 16, padding: 16, alignItems: "center" },
  quickLabel: { marginTop: 8, fontWeight: "800", fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "900", paddingHorizontal: 20, marginBottom: 12 },
  campaignCard: { marginHorizontal: 20, borderRadius: 16, marginBottom: 16, overflow: "hidden" },
  campaignImage: { width: "100%", height: 130 },
  campaignTitle: { fontSize: 15, fontWeight: "900", marginBottom: 4 },
  campaignDesc: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", borderRadius: 3 },
  campaignFooter: { flexDirection: "row", justifyContent: "space-between" },
});
