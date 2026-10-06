import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Registers the device for push, saves the Expo push token on the
// user's Firestore doc so admins/NGOs can target notifications.
// Wrapped in try/catch throughout because this is called "fire and
// forget" from dashboards — a push-registration failure (no physical
// device, no EAS projectId configured yet, permission denied, etc.)
// should never crash or block the screen that called it.
export async function registerForPushNotifications(userId, collectionName = "users") {
  try {
    if (!Device.isDevice) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    // Since SDK 49+, getExpoPushTokenAsync needs the EAS projectId to
    // resolve which push credentials to use. It's set automatically once
    // you run `eas init` / `eas build`, at which point it appears at
    // Constants.expoConfig.extra.eas.projectId. Until then this stays
    // undefined and push tokens simply won't be available.
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenData.data;

    if (userId) {
      await updateDoc(doc(db, collectionName, userId), { fcmToken: token }).catch(() => {});
    }
    return token;
  } catch (err) {
    console.warn("registerForPushNotifications failed:", err?.message || err);
    return null;
  }
}

export function addNotificationListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}
