import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet } from "react-native";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { registerVolunteer, fetchNgos } from "../../services/firestoreService";

export default function Volunteer({ navigation }) {
  const { colors } = useTheme();
  const { user, profile } = useAuth();
  const [ngos, setNgos] = useState([]);
  const [ngoId, setNgoId] = useState(null);
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchNgos({ onlyVerified: true }).then(setNgos); }, []);

  const handleSubmit = async () => {
    if (!user) { navigation.navigate("Login"); return; }
    if (!ngoId || !skills.trim() || !availability.trim()) return;
    setLoading(true);
    try {
      await registerVolunteer({
        userId: user.uid,
        userName: `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim(),
        ngoId, skills: skills.trim(), availability: availability.trim(),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 14 }}>
          <Text style={{ color: colors.accent, fontWeight: "800" }}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>Become a Volunteer</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>Offer your time and skills to a verified NGO.</Text>

        {submitted ? (
          <View style={[styles.card, { backgroundColor: colors.card, alignItems: "center" }]}>
            <Text style={{ fontSize: 40 }}>🙌</Text>
            <Text style={{ color: colors.text, fontWeight: "800", marginTop: 10 }}>Application submitted!</Text>
            <Text style={{ color: colors.subtext, fontSize: 12, textAlign: "center", marginTop: 4 }}>
              The NGO will review your application and get in touch.
            </Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>Choose an NGO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {ngos.map((n) => (
                <TouchableOpacity key={n.id} onPress={() => setNgoId(n.id)} style={[styles.chip, { borderColor: colors.border, backgroundColor: ngoId === n.id ? colors.primary : "transparent" }]}>
                  <Text style={{ color: ngoId === n.id ? "#fff" : colors.text, fontSize: 12, fontWeight: "700" }}>{n.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Input label="Your Skills" placeholder="e.g. Teaching, First Aid, Marketing" value={skills} onChangeText={setSkills} />
            <Input label="Availability" placeholder="e.g. Weekends, evenings" value={availability} onChangeText={setAvailability} />

            <Button title="Submit Application" onPress={handleSubmit} loading={loading} disabled={!ngoId} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  title: { fontSize: 22, fontWeight: "900" },
  subtitle: { fontSize: 12, marginTop: 6, marginBottom: 20 },
  card: { borderRadius: 18, padding: 20 },
  label: { fontSize: 12, fontWeight: "800", marginBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, marginRight: 8 },
});
