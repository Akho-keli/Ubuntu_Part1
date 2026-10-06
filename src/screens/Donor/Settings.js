import React from "react";
import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, Switch, Alert } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { clearAllAppData } from "../../utils/storage";
import { logout } from "../../services/authService";

export default function Settings({ navigation }) {
  const { colors, mode, toggleTheme } = useTheme();

  const handleClearCache = () => {
    Alert.alert("Clear cached data", "This removes offline-cached campaigns and preferences from this device.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearAllAppData },
    ]);
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: colors.accent, fontWeight: "800" }}>← Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={{ padding: 20 }}>
        <View style={[styles.row, { backgroundColor: colors.card }]}>
          <Text style={{ color: colors.text, fontWeight: "700" }}>Dark Mode</Text>
          <Switch value={mode === "dark"} onValueChange={toggleTheme} />
        </View>

        <TouchableOpacity style={[styles.row, { backgroundColor: colors.card }]} onPress={handleClearCache}>
          <Text style={{ color: colors.text, fontWeight: "700" }}>Clear Offline Cache</Text>
          <Text style={{ color: colors.subtext }}>🗑️</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.row, { backgroundColor: colors.card }]} onPress={() => navigation.navigate("Profile")}>
          <Text style={{ color: colors.text, fontWeight: "700" }}>Edit Profile</Text>
          <Text style={{ color: colors.subtext }}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.row, { backgroundColor: colors.card, marginTop: 20 }]} onPress={handleLogout}>
          <Text style={{ color: colors.danger, fontWeight: "800" }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: "900", marginTop: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 12, padding: 16, marginBottom: 12 },
});
