import React, { useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { createCampaign, logActivity } from "../../services/firestoreService";
import { uploadImageAsync } from "../../services/storageService";
import { geocodeAddress } from "../../services/geocodeApi";

const CATEGORIES = ["Education", "Health", "Environment", "Poverty Relief", "Animal Welfare", "Disaster Relief"];

export default function CreateCampaign({ navigation }) {
  const { colors } = useTheme();
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [contactPhone, setContactPhone] = useState(profile?.phone || "");
  const [address, setAddress] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!description.trim()) e.description = "Description is required.";
    if (!goalAmount || isNaN(goalAmount) || Number(goalAmount) <= 0) e.goalAmount = "Enter a valid goal amount.";
    if (!contactPhone.trim()) e.contactPhone = "A contact number lets donors and people in need reach you.";
    if (!address.trim()) e.address = "An address lets people get directions to this campaign.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let imageURL = null;
      if (imageUri) imageURL = await uploadImageAsync(imageUri, "campaigns", `${user.uid}_${Date.now()}`);

      // Geocode the typed address (external API #2) so people-in-need can
      // get Maps directions straight to this campaign from CampaignDetails.
      const geo = await geocodeAddress(address.trim());

      const ref = await createCampaign({
        ngoId: user.uid,
        ngoName: profile?.name,
        title: title.trim(),
        description: description.trim(),
        category,
        goalAmount: Number(goalAmount),
        imageURL,
        contactPhone: contactPhone.trim(),
        location: geo
          ? { lat: geo.lat, lng: geo.lng, address: address.trim() }
          : { lat: null, lng: null, address: address.trim() },
      });

      logActivity({
        uid: user.uid, email: profile?.email, role: "ngo",
        action: "campaign_create", meta: { campaignId: ref.id, title: title.trim() },
      });

      navigation.navigate("ManageCampaigns");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 14 }}>
          <Text style={{ color: colors.accent, fontWeight: "800" }}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>Create Campaign</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>Submitted campaigns need admin approval before going live.</Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={pickImage} style={[styles.imagePicker, { borderColor: colors.border }]}>
            {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : <Text style={{ color: colors.subtext }}>📷 Add cover image</Text>}
          </TouchableOpacity>

          <Input label="Campaign Title" value={title} onChangeText={setTitle} error={errors.title} />
          <Input label="Description" value={description} onChangeText={setDescription} error={errors.description} multiline numberOfLines={4} style={{ height: 90, textAlignVertical: "top" }} />
          <Input label="Goal Amount (ZAR)" value={goalAmount} onChangeText={setGoalAmount} error={errors.goalAmount} keyboardType="numeric" />
          <Input
            label="Contact Phone Number"
            placeholder="e.g. +27 82 123 4567"
            value={contactPhone}
            onChangeText={setContactPhone}
            error={errors.contactPhone}
            keyboardType="phone-pad"
          />
          <Input
            label="Campaign Location / Address"
            placeholder="Street, City — shown as 'Get Directions' to donors"
            value={address}
            onChangeText={setAddress}
            error={errors.address}
          />

          <Text style={[styles.label, { color: colors.text }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.chip, { borderColor: colors.border, backgroundColor: category === c ? colors.primary : "transparent" }]}>
                <Text style={{ color: category === c ? "#fff" : colors.text, fontSize: 12, fontWeight: "700" }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Button title="Submit Campaign" onPress={handleCreate} loading={loading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  title: { fontSize: 22, fontWeight: "900" },
  subtitle: { fontSize: 12, marginTop: 6, marginBottom: 20 },
  card: { borderRadius: 18, padding: 20 },
  imagePicker: { height: 140, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", justifyContent: "center", alignItems: "center", marginBottom: 16, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  label: { fontSize: 12, fontWeight: "800", marginBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, marginRight: 8 },
});
