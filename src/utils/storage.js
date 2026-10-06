// ============================================================
// ASYNC STORAGE HELPER
// Centralised wrapper so every screen caches/reads data the same way.
// Used for: offline campaign cache, cached user profile, theme
// preference, "remember me" email, onboarding-seen flag, draft forms.
// ============================================================
import AsyncStorage from "@react-native-async-storage/async-storage";

export const StorageKeys = {
  USER_PROFILE: "ubuntucare:userProfile",
  AUTH_ROLE: "ubuntucare:authRole", // "donor" | "ngo" | "admin"
  CACHED_CAMPAIGNS: "ubuntucare:cachedCampaigns",
  CACHED_NGOS: "ubuntucare:cachedNgos",
  THEME: "ubuntucare:theme", // "light" | "dark"
  REMEMBER_EMAIL: "ubuntucare:rememberEmail",
  ONBOARDING_SEEN: "ubuntucare:onboardingSeen",
  DRAFT_DONATION: "ubuntucare:draftDonation",
  LAST_SYNC: "ubuntucare:lastSync",
};

export async function saveData(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn("AsyncStorage save failed", key, e);
    return false;
  }
}

export async function getData(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw != null ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("AsyncStorage read failed", key, e);
    return null;
  }
}

export async function removeData(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn("AsyncStorage remove failed", key, e);
  }
}

export async function clearAllAppData() {
  const keys = Object.values(StorageKeys);
  await AsyncStorage.multiRemove(keys);
}
