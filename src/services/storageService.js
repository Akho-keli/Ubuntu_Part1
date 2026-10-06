import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebaseConfig";

// Uploads a local image (from expo-image-picker) to Firebase Storage
// and returns its public download URL. `folder` groups files, e.g.
// "avatars", "campaigns", "ngoLogos".
export async function uploadImageAsync(localUri, folder, fileName) {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const path = `${folder}/${fileName || Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}
