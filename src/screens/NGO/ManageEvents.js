import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { fetchUpcomingEvents, createEvent } from "../../services/firestoreService";
import { EmptyState, LoadingOverlay } from "../../components/Feedback";

export default function ManageEvents({ navigation }) {
  const { colors } = useTheme();
  const { user, profile } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", location: "" });

  const load = useCallback(() => {
    fetchUpcomingEvents()
      .then((all) => setEvents(all.filter((e) => e.ngoId === user?.uid)))
      .finally(() => setLoading(false));
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  const handleCreate = async () => {
    if (!form.title.trim() || !form.date.trim()) return;
    setSaving(true);
    try {
      await createEvent({
        ngoId: user.uid,
        ngoName: profile?.name,
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date.trim(),
        location: form.location.trim(),
      });
      setForm({ title: "", description: "", date: "", location: "" });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.accent, fontWeight: "800" }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>My Events</Text>
      </View>

      {loading ? (
        <LoadingOverlay />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {events.length === 0 ? (
            <EmptyState icon="📅" title="No events yet" subtitle="Create your first event to invite volunteers and donors." />
          ) : (
            events.map((e) => (
              <View key={e.id} style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={{ color: colors.text, fontWeight: "900", fontSize: 14 }}>{e.title}</Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700", marginTop: 4 }}>📅 {e.date}</Text>
                <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 2 }}>📍 {e.location}</Text>
                <Text style={{ color: colors.subtext, fontSize: 11, marginTop: 8 }}>{(e.attendees || []).length} attending</Text>
              </View>
            ))
          )}

          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowForm(true)}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>+ New Event</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.text, marginBottom: 14 }]}>New Event</Text>
            <Input label="Title" value={form.title} onChangeText={set("title")} />
            <Input label="Date" placeholder="e.g. 12 Dec 2026" value={form.date} onChangeText={set("date")} />
            <Input label="Location" value={form.location} onChangeText={set("location")} />
            <Input label="Description" value={form.description} onChangeText={set("description")} multiline numberOfLines={3} style={{ height: 80, textAlignVertical: "top" }} />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <Button title="Cancel" variant="outline" onPress={() => setShowForm(false)} style={{ flex: 1 }} />
              <Button title="Create" onPress={handleCreate} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: "900", marginTop: 10 },
  card: { borderRadius: 14, padding: 16, marginBottom: 14 },
  addBtn: { borderRadius: 12, padding: 16, alignItems: "center", marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22 },
});
