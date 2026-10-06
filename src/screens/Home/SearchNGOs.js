import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fetchNgos } from "../../services/firestoreService";
import { EmptyState, LoadingOverlay } from "../../components/Feedback";

export default function SearchNGOs({ navigation }) {
  const { colors } = useTheme();
  const [ngos, setNgos] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNgos({ onlyVerified: true }).then(setNgos).finally(() => setLoading(false));
  }, []);

  const filtered = ngos.filter(
    (n) => n.name?.toLowerCase().includes(query.toLowerCase()) || n.category?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: colors.accent, fontWeight: "800" }}>← Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Find Verified NGOs</Text>
      </View>

      <TextInput
        placeholder="Search by name or category..."
        placeholderTextColor={colors.subtext}
        value={query}
        onChangeText={setQuery}
        style={[styles.search, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
      />

      {loading ? (
        <LoadingOverlay label="Finding NGOs..." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {filtered.length === 0 ? (
            <EmptyState icon="🔎" title="No NGOs found" subtitle="Try a different search term." />
          ) : (
            filtered.map((ngo) => (
              <View key={ngo.id} style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={[styles.name, { color: colors.text }]}>{ngo.name}</Text>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "800", marginTop: 2 }}>{ngo.category}</Text>
                <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 6 }} numberOfLines={3}>{ngo.description}</Text>
                {ngo.location?.address ? (
                  <Text style={{ color: colors.subtext, fontSize: 11, marginTop: 8 }}>📍 {ngo.location.address}</Text>
                ) : null}
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
  search: { marginHorizontal: 20, height: 46, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14 },
  card: { borderRadius: 14, padding: 16, marginBottom: 14 },
  name: { fontSize: 15, fontWeight: "900" },
});
