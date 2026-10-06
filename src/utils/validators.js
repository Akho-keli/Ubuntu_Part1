export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

export const isValidPhone = (phone) =>
  /^[0-9+\s()-]{7,15}$/.test(String(phone).trim());

export const isStrongPassword = (password) =>
  typeof password === "string" && password.length >= 6;

export function friendlyFirebaseError(error) {
  const code = error?.code || "";
  const map = {
    "auth/email-already-in-use": "That email is already registered.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return map[code] || error?.message || "Something went wrong. Please try again.";
}
