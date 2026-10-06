import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { fetchNotifications } from "../../services/firestoreService";
import { EmptyState, LoadingOverlay } from "../../components/Feedback";

export default function Notifications({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchNotifications(user.uid).then(setItems).finally(() => setLoading(false));
    else setLoading(false);
  }, [user]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: colors.accent, fontWeight: "800" }}>← Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
      </View>

      {loading ? (
        <LoadingOverlay />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {items.length === 0 ? (
            <EmptyState icon="🔔" title="You're all caught up" />
          ) : (
            items.map((n) => (
              <View key={n.id} style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={{ color: colors.text, fontWeight: "800", fontSize: 13 }}>{n.title}</Text>
                <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 4 }}>{n.body}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: "900", marginTop: 10 },
  card: { borderRadius: 12, padding: 14, marginBottom: 10 },
});
