import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useTheme } from "../../context/ThemeContext";
import { loginUser } from "../../services/authService";
import { friendlyFirebaseError, isValidEmail } from "../../utils/validators";
import { getData, saveData, StorageKeys } from "../../utils/storage";

export default function Login({ navigation }) {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const savedEmail = await getData(StorageKeys.REMEMBER_EMAIL);
      if (savedEmail) setEmail(savedEmail);
    })();
  }, []);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email is required.";
    else if (!isValidEmail(email)) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    setLoginError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await loginUser({ email: email.trim(), password });
      if (remember) await saveData(StorageKeys.REMEMBER_EMAIL, email.trim());
      navigation.reset({ index: 0, routes: [{ name: "DonorDashboard" }] });
    } catch (err) {
      setLoginError(friendlyFirebaseError(err));
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

          <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Sign in to continue supporting causes you care about.
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={(t) => { setEmail(t); setErrors((p) => ({ ...p, email: "" })); }}
              error={errors.email}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(t) => { setPassword(t); setErrors((p) => ({ ...p, password: "" })); }}
              error={errors.password}
              secureTextEntry
            />

            <TouchableOpacity onPress={() => setRemember(!remember)} style={styles.rememberRow}>
              <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: remember ? colors.primary : "transparent" }]} />
              <Text style={{ color: colors.subtext, fontSize: 12 }}>Remember my email</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={{ alignSelf: "flex-end", marginBottom: 16 }}>
              <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 12 }}>Forgot password?</Text>
            </TouchableOpacity>

            {loginError ? (
              <View style={[styles.errorBox, { borderColor: colors.danger }]}>
                <Text style={{ color: colors.danger, fontSize: 12, textAlign: "center" }}>{loginError}</Text>
              </View>
            ) : null}

            <Button title="Sign In" onPress={handleLogin} loading={loading} />

            <View style={styles.registerRow}>
              <Text style={{ color: colors.subtext, fontSize: 12 }}>New here? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={{ color: colors.accent, fontWeight: "800", fontSize: 12 }}>Create an account</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate("AdminLogin")} style={{ marginTop: 24, alignSelf: "center" }}>
            <Text style={{ color: colors.subtext, fontSize: 11 }}>🔐 NGO / Admin login</Text>
          </TouchableOpacity>
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
  rememberRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, marginRight: 8 },
  errorBox: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 14 },
  registerRow: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
});
