// ============================================================
// EXTERNAL API #3 — OSRM demo routing server (free, no key required)
// Turns a start point + destination into a distance, an ETA, and a list
// of plain-English turn-by-turn steps that the app can read aloud with
// expo-speech (see CampaignDirections.js) — a lightweight, in-app version
// of GPS voice guidance, in addition to the "Open in Maps" deep link
// which hands off to the phone's own voice-guided navigation.
// Docs: http://project-osrm.org/docs/v5.24.0/api/#route-service
// ============================================================
const BASE_URL = "https://router.project-osrm.org/route/v1/driving";

// OSRM's own maneuver data is terse (type/modifier codes); this turns it
// into a short spoken/readable sentence for each step.
function describeStep(step, index, total) {
  const name = step.name && step.name.trim() ? ` onto ${step.name}` : "";
  const { type, modifier } = step.maneuver || {};

  if (index === 0) return `Head ${modifier || "straight"}${name}.`;
  if (type === "arrive" || index === total - 1) return "You have arrived at your destination.";
  if (type === "roundabout") return `At the roundabout, take the exit${name}.`;
  if (type === "turn") return `Turn ${modifier || "ahead"}${name}.`;
  if (type === "merge") return `Merge ${modifier || "ahead"}${name}.`;
  if (type === "fork") return `Keep ${modifier || "straight"} at the fork${name}.`;
  return `Continue${name}.`;
}

export async function getDrivingDirections({ fromLat, fromLng, toLat, toLng }) {
  try {
    const url = `${BASE_URL}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;

    const route = data.routes[0];
    const rawSteps = route.legs[0].steps;
    const steps = rawSteps.map((s, i) => describeStep(s, i, rawSteps.length));

    return {
      distanceMeters: route.distance,
      distanceText: route.distance >= 1000 ? `${(route.distance / 1000).toFixed(1)} km` : `${Math.round(route.distance)} m`,
      durationSeconds: route.duration,
      durationText: route.duration >= 3600
        ? `${Math.round(route.duration / 3600)} hr ${Math.round((route.duration % 3600) / 60)} min`
        : `${Math.round(route.duration / 60)} min`,
      steps,
      // GeoJSON [lng, lat] pairs — handy if a future version renders the
      // route on an in-app map.
      coordinates: route.geometry.coordinates,
    };
  } catch (e) {
    console.warn("directionsApi error", e);
    return null;
  }
}
