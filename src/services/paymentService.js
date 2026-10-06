// ============================================================
// PAYMENT — Paystack (works well for ZAR/NGN/GHS donations)
// The public key is safe client-side. Card capture happens in
// Paystack's own hosted checkout (via WebView), so raw card numbers
// never touch this app's code. The SECRET key must never be bundled
// in the app — it lives only in the Cloud Function that verifies the
// transaction server-side (see functions/index.js: verifyPaystackTx).
// ============================================================
export const PAYSTACK_PUBLIC_KEY = " pk_test_da573ebc1c4ccc96f90a761413e0af0dd874aa1c";

// Builds the checkout URL opened in a WebView / browser. On success,
// Paystack redirects to `callback_url` with a `reference` query param
// that the app then sends to the verifyPaystackTx Cloud Function.
export function buildPaystackCheckoutUrl({ email, amountInCents, reference, callbackUrl }) {
  const params = new URLSearchParams({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount: String(amountInCents),
    ref: reference,
    callback_url: callbackUrl,
  });
  return `https://checkout.paystack.com/embed.js?${params.toString()}`;
}

export function generatePaymentReference(userId) {
  return `ubuntucare_${userId}_${Date.now()}`;
}

// Calls the deployed Cloud Function that securely verifies the
// transaction with Paystack's secret key before we credit anything.
export async function verifyPayment(reference) {
  const res = await fetch(
    `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/verifyPaystackTx?reference=${reference}`
  );
  return res.json(); // { verified: true/false, amount, currency }
}
