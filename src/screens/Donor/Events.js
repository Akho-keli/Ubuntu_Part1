import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fetchUpcomingEvents } from "../../services/firestoreService";
import { EmptyState, LoadingOverlay } from "../../components/Feedback";

export default function Events({ navigation }) {
  const { colors } = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUpcomingEvents().then(setEvents).finally(() => setLoading(false)); }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: colors.accent, fontWeight: "800" }}>← Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Upcoming Events</Text>
      </View>

      {loading ? (
        <LoadingOverlay />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {events.length === 0 ? (
            <EmptyState icon="📅" title="No events scheduled" subtitle="Check back soon for upcoming NGO events." />
          ) : (
            events.map((e) => (
              <View key={e.id} style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={[styles.eventTitle, { color: colors.text }]}>{e.title}</Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700", marginTop: 4 }}>📅 {e.date}</Text>
                <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 2 }}>📍 {e.location}</Text>
                <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 8 }} numberOfLines={3}>{e.description}</Text>
                <Text style={{ color: colors.subtext, fontSize: 11, marginTop: 8 }}>{(e.attendees || []).length} attending</Text>
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
  card: { borderRadius: 14, padding: 16, marginBottom: 14 },
  eventTitle: { fontSize: 15, fontWeight: "900" },
});
