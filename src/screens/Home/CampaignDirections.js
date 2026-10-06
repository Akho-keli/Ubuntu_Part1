import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet, Platform, Linking, Alert,
} from "react-native";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { getDrivingDirections } from "../../services/directionsApi";
import { logActivity } from "../../services/firestoreService";
import Button from "../../components/Button";
import { LoadingOverlay, EmptyState } from "../../components/Feedback";

export default function CampaignDirections({ route, navigation }) {
  const { destLat, destLng, destAddress, campaignTitle } = route.params;
  const { colors } = useTheme();
  const { user, profile, role } = useAuth();

  const [origin, setOrigin] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [directions, setDirections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  const loadRoute = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationDenied(true);
        setLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const fromLat = pos.coords.latitude;
      const fromLng = pos.coords.longitude;
      setOrigin({ lat: fromLat, lng: fromLng });

      const result = await getDrivingDirections({ fromLat, fromLng, toLat: destLat, toLng: destLng });
      setDirections(result);
    } catch (e) {
      console.warn("Route load failed", e);
    } finally {
      setLoading(false);
    }
  }, [destLat, destLng]);

  useEffect(() => { loadRoute(); }, [loadRoute]);

  // Stop any speech if the person navigates away mid-readout.
  useEffect(() => () => { Speech.stop(); }, []);

  const speakDirections = () => {
    if (!directions?.steps?.length) return;
    setSpeaking(true);
    const fullText = `Directions to ${campaignTitle}. Total distance ${directions.distanceText}, about ${directions.durationText}. ${directions.steps.join(" ")}`;
    Speech.speak(fullText, {
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    logActivity({
      uid: user?.uid || "guest", email: profile?.email, role: role || "guest",
      action: "directions_voice_readout", meta: { campaignTitle },
    });
  };

  const stopSpeaking = () => { Speech.stop(); setSpeaking(false); };

  // Hands off to the phone's own Maps app, which gives real, continuous
  // spoken turn-by-turn GPS navigation — the most reliable "voice like
  // the GPS" experience, especially for a long drive.
  const openInNativeMaps = async () => {
    logActivity({
      uid: user?.uid || "guest", email: profile?.email, role: role || "guest",
      action: "directions_open_native_maps", meta: { campaignTitle },
    });

    const label = encodeURIComponent(campaignTitle || "Campaign location");
    const iosUrl = `maps://app?daddr=${destLat},${destLng}&dirflg=d`;
    const androidNavUrl = `google.navigation:q=${destLat},${destLng}`;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;

    const primary = Platform.OS === "ios" ? iosUrl : androidNavUrl;
    try {
      const supported = await Linking.canOpenURL(primary);
      await Linking.openURL(supported ? primary : webUrl);
    } catch (e) {
      Linking.openURL(webUrl).catch(() =>
        Alert.alert("Couldn't open Maps", "Please make sure a maps app is installed.")
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.accent, fontWeight: "800" }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>Directions to {campaignTitle}</Text>
      </View>

      {loading ? (
        <LoadingOverlay label="Finding the best route..." />
      ) : locationDenied ? (
        <View style={{ padding: 20 }}>
          <EmptyState
            icon="📍"
            title="Location permission needed"
            subtitle="Allow location access so we can calculate the route and voice directions from where you are."
          />
          <Button title="Try Again" onPress={loadRoute} />
          <Button title="Open in Maps App Instead" variant="outline" onPress={openInNativeMaps} style={{ marginTop: 12 }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ color: colors.text, fontWeight: "800", fontSize: 13, marginBottom: 4 }}>
            📍 {destAddress || "Destination"}
          </Text>

          {directions ? (
            <>
              <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
                <View>
                  <Text style={styles.summaryLabel}>Distance</Text>
                  <Text style={styles.summaryValue}>{directions.distanceText}</Text>
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Est. Time</Text>
                  <Text style={styles.summaryValue}>{directions.durationText}</Text>
                </View>
              </View>

              {/* VOICE — read every step aloud in-app, like a GPS voice */}
              <View style={styles.voiceRow}>
                <Button
                  title={speaking ? "🔊 Speaking..." : "🔊 Read Directions Aloud"}
                  onPress={speaking ? stopSpeaking : speakDirections}
                  variant={speaking ? "outline" : "primary"}
                  style={{ flex: 1 }}
                />
              </View>

              <Button
                title="🧭 Start Voice-Guided GPS Navigation"
                onPress={openInNativeMaps}
                variant="outline"
                style={{ marginTop: 10, marginBottom: 20 }}
              />
              <Text style={{ color: colors.subtext, fontSize: 10, textAlign: "center", marginTop: -12, marginBottom: 20 }}>
                Opens your phone's Maps app for continuous, spoken turn-by-turn navigation.
              </Text>

              {/* TEXT — full written steps for anyone who prefers reading */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Step-by-Step Directions</Text>
              {directions.steps.map((step, i) => (
                <View key={i} style={[styles.stepRow, { backgroundColor: colors.card }]}>
                  <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepBadgeText}>{i + 1}</Text>
                  </View>
                  <Text style={{ color: colors.text, fontSize: 13, flex: 1, marginLeft: 10 }}>{step}</Text>
                </View>
              ))}
            </>
          ) : (
            <EmptyState icon="🧭" title="Couldn't calculate a route" subtitle="You can still open the destination directly in your Maps app." />
          )}

          <Button title="Open in Maps App" variant="outline" onPress={openInNativeMaps} style={{ marginTop: 10 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: "900", marginTop: 10 },
  summaryCard: { flexDirection: "row", justifyContent: "space-around", borderRadius: 16, padding: 18, marginBottom: 18 },
  summaryLabel: { color: "#E2FBEA", fontSize: 11, fontWeight: "700", textAlign: "center" },
  summaryValue: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 4, textAlign: "center" },
  voiceRow: { flexDirection: "row" },
  sectionTitle: { fontSize: 15, fontWeight: "900", marginBottom: 10 },
  stepRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 12, marginBottom: 8 },
  stepBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  stepBadgeText: { color: "#fff", fontWeight: "900", fontSize: 11 },
});
