import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { WebView } from "react-native-webview";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { convertAmount } from "../../services/currencyApi";
import { recordDonation } from "../../services/firestoreService";
import { generatePaymentReference, PAYSTACK_PUBLIC_KEY } from "../../services/paymentService";
import { saveData, getData, StorageKeys } from "../../utils/storage";

const PRESETS = [50, 100, 250, 500, 1000];
const CURRENCIES = ["ZAR", "USD", "EUR", "GBP"];

export default function Donate({ route, navigation }) {
  const { campaignId, campaignTitle, ngoId } = route.params;
  const { colors } = useTheme();
  const { user, profile } = useAuth();

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ZAR");
  const [converted, setConverted] = useState(null);
  const [anonymous, setAnonymous] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reference] = useState(generatePaymentReference(user?.uid || "guest"));

  // Restore any in-progress donation draft (AsyncStorage) if the user
  // navigated away mid-form — e.g. app was backgrounded during entry.
  useEffect(() => {
    getData(StorageKeys.DRAFT_DONATION).then((draft) => {
      if (draft?.campaignId === campaignId) {
        setAmount(String(draft.amount || ""));
        setCurrency(draft.currency || "ZAR");
      }
    });
  }, []);

  useEffect(() => {
    saveData(StorageKeys.DRAFT_DONATION, { campaignId, amount, currency });
  }, [amount, currency]);

  useEffect(() => {
    if (currency !== "ZAR" && amount) {
      convertAmount(parseFloat(amount) || 0, "ZAR", currency).then(setConverted);
    } else {
      setConverted(null);
    }
  }, [amount, currency]);

  const numericAmount = parseFloat(amount) || 0;

  const openCheckout = () => {
    if (numericAmount < 10) return;
    setShowCheckout(true);
  };

  // Paystack redirects to this URL with ?trxref=...&reference=... on success.
  const handleNavChange = async (navState) => {
    if (navState.url.includes("payment-success") || navState.url.includes(reference)) {
      setShowCheckout(false);
      setProcessing(true);
      try {
        await recordDonation({
          userId: user.uid,
          campaignId,
          ngoId,
          amount: numericAmount,
          currency,
          paymentRef: reference,
          anonymous,
        });
        await saveData(StorageKeys.DRAFT_DONATION, null);
        navigation.replace("DonationHistory", { justDonated: true });
      } catch (e) {
        console.warn("Donation record failed", e);
      } finally {
        setProcessing(false);
      }
    }
  };

  const checkoutHtml = `
    <html><body style="margin:0;font-family:sans-serif;">
    <script src="https://js.paystack.co/v1/inline.js"></script>
    <script>
      var handler = PaystackPop.setup({
        key: '${PAYSTACK_PUBLIC_KEY}',
        email: '${profile?.email || "donor@example.com"}',
        amount: ${Math.round(numericAmount * 100)},
        ref: '${reference}',
        currency: '${currency}',
        callback: function(response) {
          window.location.href = 'https://ubuntucare.app/payment-success?reference=' + response.reference;
        },
        onClose: function() {
          window.location.href = 'https://ubuntucare.app/payment-cancelled';
        }
      });
      handler.openIframe();
    </script>
    </body></html>`;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 14 }}>
          <Text style={{ color: colors.accent, fontWeight: "800" }}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>Donate to</Text>
        <Text style={[styles.campaignName, { color: colors.primary }]}>{campaignTitle}</Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Choose an amount</Text>
          <View style={styles.presetRow}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setAmount(String(p))}
                style={[styles.presetChip, { borderColor: colors.border, backgroundColor: amount === String(p) ? colors.primary : "transparent" }]}
              >
                <Text style={{ color: amount === String(p) ? "#fff" : colors.text, fontWeight: "800" }}>R{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Or enter a custom amount (ZAR)" keyboardType="numeric" value={amount} onChangeText={setAmount} placeholder="e.g. 300" />

          <Text style={[styles.label, { color: colors.text }]}>Currency reference</Text>
          <View style={styles.presetRow}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity key={c} onPress={() => setCurrency(c)} style={[styles.presetChip, { borderColor: colors.border, backgroundColor: currency === c ? colors.accent : "transparent" }]}>
                <Text style={{ color: currency === c ? "#fff" : colors.text, fontWeight: "800" }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {converted != null && (
            <Text style={{ color: colors.subtext, fontSize: 12, marginBottom: 10 }}>
              ≈ {converted} {currency} (live exchange rate)
            </Text>
          )}

          <TouchableOpacity onPress={() => setAnonymous(!anonymous)} style={styles.anonRow}>
            <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: anonymous ? colors.primary : "transparent" }]} />
            <Text style={{ color: colors.subtext, fontSize: 12 }}>Donate anonymously</Text>
          </TouchableOpacity>

          <Button title={`Donate R${numericAmount || 0}`} onPress={openCheckout} disabled={numericAmount < 10} loading={processing} />
          <Text style={{ color: colors.subtext, fontSize: 10, textAlign: "center", marginTop: 10 }}>
            Minimum donation R10. Payments are securely processed by Paystack.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={showCheckout} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => setShowCheckout(false)} style={styles.closeModal}>
            <Text style={{ fontWeight: "900" }}>✕ Close</Text>
          </TouchableOpacity>
          <WebView source={{ html: checkoutHtml }} onNavigationStateChange={handleNavChange} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700" },
  campaignName: { fontSize: 22, fontWeight: "900", marginBottom: 20 },
  card: { borderRadius: 18, padding: 20 },
  label: { fontSize: 12, fontWeight: "800", marginBottom: 10 },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  presetChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  anonRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, marginRight: 8 },
  closeModal: { padding: 16 },
});
