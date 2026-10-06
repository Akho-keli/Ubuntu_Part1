import React, { useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { loginAdmin } from "../../services/authService";
import { friendlyFirebaseError, isValidEmail } from "../../utils/validators";

const colors = { bg: "#0B1120", card: "#FFFFFF", accent: "#60A5FA", text: "#0F172A", subtext: "#64748B", primary: "#2563EB", danger: "#DC2626" };

export default function AdminLogin({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!isValidEmail(email)) e.email = "Enter a valid admin email.";
    if (!password) e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    setLoginError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await loginAdmin({ email: email.trim(), password });
      navigation.reset({ index: 0, routes: [{ name: "AdminDashboard" }] });
    } catch (err) {
      setLoginError(friendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")} style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.accent, fontWeight: "800" }}>← Back to Home</Text>
        </TouchableOpacity>

        <View style={styles.brand}>
          <Text style={{ fontSize: 32 }}>🔐</Text>
          <Text style={styles.brandTitle}>UbuntuCare</Text>
          <Text style={styles.adminLabel}>ADMIN PORTAL</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Admin Login</Text>
          <Text style={styles.subtitle}>Sign in to securely manage the UbuntuCare platform.</Text>

          <View style={styles.notice}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>🛡️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>Restricted Access</Text>
              <Text style={styles.noticeText}>This portal is only for authorized administrators.</Text>
            </View>
          </View>

          <Input label="Admin Email" placeholder="admin@ubuntucare.org" value={email} onChangeText={(t) => { setEmail(t); setErrors((p) => ({ ...p, email: "" })); }} error={errors.email} autoCapitalize="none" keyboardType="email-address" />
          <Input label="Password" placeholder="Enter your password" value={password} onChangeText={(t) => { setPassword(t); setErrors((p) => ({ ...p, password: "" })); }} error={errors.password} secureTextEntry />

          {loginError ? (
            <View style={styles.errorBox}><Text style={styles.errorText}>{loginError}</Text></View>
          ) : null}

          <Button title="Secure Admin Login" onPress={handleLogin} loading={loading} />

          <View style={styles.registerRow}>
            <Text style={{ color: colors.subtext, fontSize: 12, textAlign: "center" }}>
              Admin accounts are provisioned by the platform administrator. Contact them for access.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, flexGrow: 1 },
  brand: { alignItems: "center", marginBottom: 20 },
  brandTitle: { color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 8 },
  adminLabel: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 22 },
  title: { color: colors.text, fontSize: 24, fontWeight: "900", textAlign: "center" },
  subtitle: { color: colors.subtext, fontSize: 12, textAlign: "center", marginTop: 6, marginBottom: 18 },
  notice: { flexDirection: "row", backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE", borderRadius: 12, padding: 12, marginBottom: 18 },
  noticeTitle: { color: "#1D4ED8", fontWeight: "900", fontSize: 12, marginBottom: 2 },
  noticeText: { color: "#475569", fontSize: 10 },
  errorBox: { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 10, padding: 10, marginBottom: 14 },
  errorText: { color: colors.danger, fontSize: 11, textAlign: "center", fontWeight: "700" },
  registerRow: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
});
