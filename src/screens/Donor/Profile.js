import React, { useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { uploadImageAsync } from "../../services/storageService";
import { logActivity } from "../../services/firestoreService";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { saveData, StorageKeys } from "../../utils/storage";

export default function Profile({ navigation }) {
  const { colors } = useTheme();
  const { user, profile, setProfile } = useAuth();
  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 });
    if (result.canceled) return;
    setUploading(true);
    try {
      const url = await uploadImageAsync(result.assets[0].uri, "avatars", user.uid);
      await updateDoc(doc(db, "users", user.uid), { photoURL: url });
      const updated = { ...profile, photoURL: url };
      setProfile(updated);
      await saveData(StorageKeys.USER_PROFILE, updated);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { firstName, lastName, phone });
      const updated = { ...profile, firstName, lastName, phone };
      setProfile(updated);
      await saveData(StorageKeys.USER_PROFILE, updated);
      logActivity({
        uid: user.uid, email: profile?.email, role: "donor",
        action: "profile_update", meta: { fields: ["firstName", "lastName", "phone"] },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 14 }}>
          <Text style={{ color: colors.accent, fontWeight: "800" }}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.avatarWrap}>
          <TouchableOpacity onPress={pickImage} style={[styles.avatar, { backgroundColor: colors.card }]}>
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.avatarImg} />
            ) : (
              <Text style={{ fontSize: 32 }}>👤</Text>
            )}
          </TouchableOpacity>
          <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "700", marginTop: 8 }}>
            {uploading ? "Uploading..." : "Change photo"}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Input label="First Name" value={firstName} onChangeText={setFirstName} />
          <Input label="Last Name" value={lastName} onChangeText={setLastName} />
          <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input label="Email" value={profile?.email} editable={false} style={{ opacity: 0.6 }} />

          {saved && <Text style={{ color: colors.primary, fontSize: 12, marginBottom: 10, fontWeight: "700" }}>✓ Saved</Text>}
          <Button title="Save Changes" onPress={handleSave} loading={saving} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  avatarWrap: { alignItems: "center", marginBottom: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%" },
  card: { borderRadius: 18, padding: 20 },
});
