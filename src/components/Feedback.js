import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export function LoadingOverlay({ label = "Loading..." }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.subtext, marginTop: 10 }}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon = "📭", title, subtitle }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 40, marginBottom: 10 }}>{icon}</Text>
      <Text style={{ color: colors.text, fontWeight: "800", fontSize: 15 }}>{title}</Text>
      {subtitle ? (
        <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 4, textAlign: "center" }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
});
