// ============================================================
// EXTERNAL API #2 — OpenStreetMap Nominatim (free, no key required)
// Used for: turning an NGO's typed address into lat/lng when they
// register, and for "NGOs near me" search on the donor side.
// Docs: https://nominatim.org/release-docs/latest/api/Search/
// Usage policy requires a descriptive User-Agent, which we set below.
// ============================================================
const BASE_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeAddress(address) {
  try {
    const url = `${BASE_URL}?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "UbuntuCareApp/1.0 (contact: support@ubuntucare.org)" },
    });
    const data = await res.json();
    if (!data.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  } catch (e) {
    console.warn("geocodeApi error", e);
    return null;
  }
}
