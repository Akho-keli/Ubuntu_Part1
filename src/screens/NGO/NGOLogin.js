import React, { useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet } from "react-native";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useTheme } from "../../context/ThemeContext";
import { loginNgo } from "../../services/authService";
import { friendlyFirebaseError, isValidEmail } from "../../utils/validators";

export default function NGOLogin({ navigation }) {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!isValidEmail(email)) e.email = "Enter a valid email.";
    if (!password) e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    setLoginError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await loginNgo({ email: email.trim(), password });
      navigation.reset({ index: 0, routes: [{ name: "NGODashboard" }] });
    } catch (err) {
      setLoginError(friendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")} style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.accent, fontWeight: "800" }}>← Back to Home</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>NGO Partner Login</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>Manage your campaigns, volunteers and donations.</Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Input label="Organization Email" value={email} onChangeText={(t) => { setEmail(t); setErrors((p) => ({ ...p, email: "" })); }} error={errors.email} autoCapitalize="none" keyboardType="email-address" />
          <Input label="Password" value={password} onChangeText={(t) => { setPassword(t); setErrors((p) => ({ ...p, password: "" })); }} error={errors.password} secureTextEntry />

          {loginError ? (
            <View style={[styles.errorBox, { borderColor: colors.danger }]}>
              <Text style={{ color: colors.danger, fontSize: 12, textAlign: "center" }}>{loginError}</Text>
            </View>
          ) : null}

          <Button title="Sign In" onPress={handleLogin} loading={loading} />

          <View style={styles.registerRow}>
            <Text style={{ color: colors.subtext, fontSize: 12 }}>Register your NGO? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("NGORegister")}>
              <Text style={{ color: colors.accent, fontWeight: "800", fontSize: 12 }}>Get started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: "900" },
  subtitle: { fontSize: 13, marginTop: 6, marginBottom: 20 },
  card: { borderRadius: 18, padding: 20 },
  errorBox: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 14 },
  registerRow: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
});
