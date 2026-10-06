import React, { useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet } from "react-native";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useTheme } from "../../context/ThemeContext";
import { resetPassword } from "../../services/authService";
import { friendlyFirebaseError, isValidEmail } from "../../utils/validators";

export default function ForgotPassword({ navigation }) {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setError("");
    if (!isValidEmail(email)) { setError("Enter a valid email address."); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(friendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.accent, fontWeight: "800" }}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>Reset your password</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          Enter the email on your account and we'll send you a reset link.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {sent ? (
            <View style={{ alignItems: "center", paddingVertical: 10 }}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>📩</Text>
              <Text style={{ color: colors.text, fontWeight: "800", textAlign: "center" }}>
                Reset link sent!
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 12, textAlign: "center", marginTop: 6 }}>
                Check {email} for instructions to reset your password.
              </Text>
              <Button title="Back to Login" onPress={() => navigation.navigate("Login")} style={{ marginTop: 20, alignSelf: "stretch" }} />
            </View>
          ) : (
            <>
              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(""); }}
                error={error}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Button title="Send Reset Link" onPress={handleSend} loading={loading} />
            </>
          )}
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
});
