// ============================================================
// EXTERNAL API #1 — exchangerate-api.com (free tier)
// Lets a donor see what their local currency amount is worth in the
// NGO's target currency before confirming a donation.
// Docs: https://www.exchangerate-api.com/docs/standard-requests
// ============================================================
const BASE_URL = "https://open.er-api.com/v6/latest"; // no key required for this open endpoint

export async function getExchangeRates(baseCurrency = "ZAR") {
  try {
    const res = await fetch(`${BASE_URL}/${baseCurrency}`);
    const data = await res.json();
    if (data.result !== "success") throw new Error("Rate lookup failed");
    return data.rates; // { USD: 0.054, EUR: 0.05, ... }
  } catch (e) {
    console.warn("currencyApi error", e);
    return null;
  }
}

export async function convertAmount(amount, from, to) {
  const rates = await getExchangeRates(from);
  if (!rates || !rates[to]) return null;
  return +(amount * rates[to]).toFixed(2);
}
