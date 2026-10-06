import React, { useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet } from "react-native";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useTheme } from "../../context/ThemeContext";
import { registerNgo } from "../../services/authService";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";
import { geocodeAddress } from "../../services/geocodeApi";
import { friendlyFirebaseError, isValidEmail, isValidPhone, isStrongPassword } from "../../utils/validators";

const CATEGORIES = ["Education", "Health", "Environment", "Poverty Relief", "Animal Welfare", "Disaster Relief"];

export default function NGORegister({ navigation }) {
  const { colors } = useTheme();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", registrationNumber: "", address: "",
    category: CATEGORIES[0], description: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [regError, setRegError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key) => (val) => { setForm((p) => ({ ...p, [key]: val })); setErrors((p) => ({ ...p, [key]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Organization name is required.";
    if (!isValidEmail(form.email)) e.email = "Enter a valid email.";
    if (!isValidPhone(form.phone)) e.phone = "Enter a valid phone number.";
    if (!form.registrationNumber.trim()) e.registrationNumber = "NPO registration number is required.";
    if (!form.address.trim()) e.address = "Address is required.";
    if (!form.description.trim()) e.description = "Tell donors about your mission.";
    if (!isStrongPassword(form.password)) e.password = "At least 6 characters.";
    if (form.confirmPassword !== form.password) e.confirmPassword = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    setRegError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await registerNgo({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        registrationNumber: form.registrationNumber.trim(),
        category: form.category,
        description: form.description.trim(),
        password: form.password,
      });

      // Geocode the typed address (external API #2) and attach lat/lng
      // so this NGO shows up correctly in "NGOs near me" search.
      const geo = await geocodeAddress(form.address.trim());
      if (geo && auth.currentUser) {
        await updateDoc(doc(db, "ngos", auth.currentUser.uid), {
          location: { lat: geo.lat, lng: geo.lng, address: form.address.trim() },
        });
      }

      navigation.reset({
        index: 0,
        routes: [{ name: "NGODashboard" }],
      });
    } catch (err) {
      setRegError(friendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.navigate("NGOLogin")} style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.accent, fontWeight: "800" }}>← Back to NGO Login</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>Register Your NGO</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          Your account will be reviewed and verified by our admin team before campaigns go live.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Input label="Organization Name" value={form.name} onChangeText={set("name")} error={errors.name} />
          <Input label="Organization Email" value={form.email} onChangeText={set("email")} error={errors.email} autoCapitalize="none" keyboardType="email-address" />
          <Input label="Phone" value={form.phone} onChangeText={set("phone")} error={errors.phone} keyboardType="phone-pad" />
          <Input label="NPO Registration Number" value={form.registrationNumber} onChangeText={set("registrationNumber")} error={errors.registrationNumber} />
          <Input label="Physical Address" placeholder="Street, City, Country" value={form.address} onChangeText={set("address")} error={errors.address} />

          <Text style={[styles.label, { color: colors.text }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => set("category")(cat)}
                style={[
                  styles.chip,
                  { borderColor: colors.border, backgroundColor: form.category === cat ? colors.primary : "transparent" },
                ]}
              >
                <Text style={{ color: form.category === cat ? "#fff" : colors.text, fontSize: 12, fontWeight: "700" }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Input label="Mission Description" value={form.description} onChangeText={set("description")} error={errors.description} multiline numberOfLines={4} style={{ height: 90, textAlignVertical: "top" }} />
          <Input label="Password" value={form.password} onChangeText={set("password")} error={errors.password} secureTextEntry />
          <Input label="Confirm Password" value={form.confirmPassword} onChangeText={set("confirmPassword")} error={errors.confirmPassword} secureTextEntry />

          {regError ? (
            <View style={[styles.errorBox, { borderColor: colors.danger }]}>
              <Text style={{ color: colors.danger, fontSize: 12, textAlign: "center" }}>{regError}</Text>
            </View>
          ) : null}

          <Button title="Submit for Review" onPress={handleRegister} loading={loading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: "900" },
  subtitle: { fontSize: 12, marginTop: 6, marginBottom: 20, lineHeight: 18 },
  card: { borderRadius: 18, padding: 20 },
  label: { fontSize: 12, fontWeight: "800", marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  errorBox: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 14 },
});
