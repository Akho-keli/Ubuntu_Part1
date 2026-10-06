import React, { useState } from "react";
import {
  View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from "react-native";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useTheme } from "../../context/ThemeContext";
import { registerUser } from "../../services/authService";
import { friendlyFirebaseError, isValidEmail, isValidPhone, isStrongPassword } from "../../utils/validators";

export default function Register({ navigation }) {
  const { colors } = useTheme();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [regError, setRegError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key) => (val) => { setForm((p) => ({ ...p, [key]: val })); setErrors((p) => ({ ...p, [key]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.lastName.trim()) e.lastName = "Last name is required.";
    if (!isValidEmail(form.email)) e.email = "Enter a valid email address.";
    if (!isValidPhone(form.phone)) e.phone = "Enter a valid phone number.";
    if (!isStrongPassword(form.password)) e.password = "Password must be at least 6 characters.";
    if (form.confirmPassword !== form.password) e.confirmPassword = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    setRegError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await registerUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      navigation.reset({ index: 0, routes: [{ name: "DonorDashboard" }] });
    } catch (err) {
      setRegError(friendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.navigate("Home")} style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.accent, fontWeight: "800" }}>← Back to Home</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>Create your account</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>Join UbuntuCare and start making an impact.</Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.row}>
              <Input label="First Name" placeholder="Jane" value={form.firstName} onChangeText={set("firstName")} error={errors.firstName} style={{ flex: 1, marginRight: 8 }} />
              <Input label="Last Name" placeholder="Doe" value={form.lastName} onChangeText={set("lastName")} error={errors.lastName} style={{ flex: 1 }} />
            </View>
            <Input label="Email" placeholder="you@example.com" value={form.email} onChangeText={set("email")} error={errors.email} autoCapitalize="none" keyboardType="email-address" />
            <Input label="Phone Number" placeholder="+27 71 234 5678" value={form.phone} onChangeText={set("phone")} error={errors.phone} keyboardType="phone-pad" />
            <Input label="Password" placeholder="At least 6 characters" value={form.password} onChangeText={set("password")} error={errors.password} secureTextEntry />
            <Input label="Confirm Password" placeholder="Re-enter your password" value={form.confirmPassword} onChangeText={set("confirmPassword")} error={errors.confirmPassword} secureTextEntry />

            {regError ? (
              <View style={[styles.errorBox, { borderColor: colors.danger }]}>
                <Text style={{ color: colors.danger, fontSize: 12, textAlign: "center" }}>{regError}</Text>
              </View>
            ) : null}

            <Button title="Create Account" onPress={handleRegister} loading={loading} />

            <View style={styles.loginRow}>
              <Text style={{ color: colors.subtext, fontSize: 12 }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={{ color: colors.accent, fontWeight: "800", fontSize: 12 }}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, flexGrow: 1 },
  title: { fontSize: 26, fontWeight: "900" },
  subtitle: { fontSize: 13, marginTop: 6, marginBottom: 20 },
  card: { borderRadius: 18, padding: 20 },
  row: { flexDirection: "row" },
  errorBox: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 14 },
  loginRow: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
});
