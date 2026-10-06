import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet, Image, Share, Linking, Alert } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { subscribeToCampaign, fetchNgoById, logActivity } from "../../services/firestoreService";
import Button from "../../components/Button";
import { LoadingOverlay } from "../../components/Feedback";
import { useAuth } from "../../context/AuthContext";

export default function CampaignDetails({ route, navigation }) {
  const { campaignId } = route.params;
  const { colors } = useTheme();
  const { user, profile, role } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [ngo, setNgo] = useState(null);

  useEffect(() => {
    // Live-updates the raised amount in real time as new donations land.
    const unsub = subscribeToCampaign(campaignId, setCampaign);
    return unsub;
  }, [campaignId]);

  useEffect(() => {
    if (campaign?.ngoId) fetchNgoById(campaign.ngoId).then(setNgo);
  }, [campaign?.ngoId]);

  if (!campaign) return <LoadingOverlay label="Loading campaign..." />;

  const pct = campaign.goalAmount ? Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)) : 0;

  // A campaign may have its own phone/location (set at creation) — fall
  // back to the NGO's own contact details for older campaigns that don't.
  const contactPhone = campaign.contactPhone || ngo?.phone || null;
  const location = (campaign.location?.lat && campaign.location) || (ngo?.location?.lat && ngo.location) || null;

  const onShare = () => {
    Share.share({
      message: `Help support "${campaign.title}" on UbuntuCare! They've raised R${campaign.raisedAmount} of their R${campaign.goalAmount} goal.`,
    });
  };

  const onDonate = () => {
    if (!user) { navigation.navigate("Login"); return; }
    navigation.navigate("Donate", { campaignId: campaign.id, campaignTitle: campaign.title, ngoId: campaign.ngoId });
  };

  // Lets a person in need reach the organizer directly by phone, straight
  // from the campaign they're looking at.
  const onCall = () => {
    if (!contactPhone) {
      Alert.alert("No contact number", "This campaign hasn't listed a phone number yet.");
      return;
    }
    logActivity({
      uid: user?.uid || "guest", email: profile?.email, role: role || "guest",
      action: "campaign_call", meta: { campaignId: campaign.id, phone: contactPhone },
    });
    Linking.openURL(`tel:${contactPhone.replace(/\s+/g, "")}`);
  };

  // Sends the person straight to the in-app, voice-guided Directions
  // screen (turn-by-turn steps read aloud) which can also hand off to the
  // phone's native Maps app for full spoken GPS navigation.
  const onDirections = () => {
    if (!location) {
      Alert.alert("No location set", "This campaign hasn't listed a physical location yet.");
      return;
    }
    logActivity({
      uid: user?.uid || "guest", email: profile?.email, role: role || "guest",
      action: "campaign_directions", meta: { campaignId: campaign.id },
    });
    navigation.navigate("CampaignDirections", {
      destLat: location.lat, destLng: location.lng,
      destAddress: location.address, campaignTitle: campaign.title,
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView>
        {campaign.imageURL ? (
          <Image source={{ uri: campaign.imageURL }} style={styles.image} />
        ) : (
          <View style={[styles.image, { backgroundColor: colors.border, justifyContent: "center", alignItems: "center" }]}>
            <Text style={{ fontSize: 50 }}>🖼️</Text>
          </View>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.category, { color: colors.primary }]}>{campaign.category}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{campaign.title}</Text>
          <Text style={[styles.desc, { color: colors.subtext }]}>{campaign.description}</Text>

          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
          </View>
          <View style={styles.statsRow}>
            <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 16 }}>R{campaign.raisedAmount || 0}</Text>
            <Text style={{ color: colors.subtext, fontSize: 12 }}>raised of R{campaign.goalAmount} · {pct}%</Text>
          </View>

          <View style={styles.buttonRow}>
            <Button title="Donate Now" onPress={onDonate} style={{ flex: 1, marginRight: 10 }} />
            <Button title="Share" variant="outline" onPress={onShare} style={{ flex: 1 }} />
          </View>

          {/* PEOPLE-IN-NEED: reach the organizer or get voice-guided
              directions straight to the campaign, right from this page. */}
          <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.contactHeading, { color: colors.text }]}>Need help, or want to visit in person?</Text>
            <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 2, marginBottom: 14 }}>
              {ngo?.name ? `Organized by ${ngo.name}. ` : ""}Call the organizer directly or get spoken, turn-by-turn directions to this campaign.
            </Text>
            {location?.address ? (
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700", marginBottom: 14 }}>📍 {location.address}</Text>
            ) : null}
            <View style={styles.buttonRow}>
              <Button title="📞 Call Organizer" variant="outline" onPress={onCall} style={{ flex: 1, marginRight: 10 }} />
              <Button title="🧭 Get Directions" onPress={onDirections} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  image: { width: "100%", height: 240 },
  backBtn: { position: "absolute", top: 16, left: 16, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  content: { padding: 20 },
  category: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: "900", marginBottom: 10 },
  desc: { fontSize: 13, lineHeight: 20, marginBottom: 20 },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 10 },
  progressFill: { height: "100%", borderRadius: 4 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 },
  buttonRow: { flexDirection: "row" },
  contactCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 20 },
  contactHeading: { fontSize: 14, fontWeight: "900" },
});
