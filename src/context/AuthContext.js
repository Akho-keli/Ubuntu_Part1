import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { getData, saveData, StorageKeys } from "../utils/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Firebase auth user
  const [profile, setProfile] = useState(null); // Firestore profile (donor/ngo/admin)
  const [role, setRole] = useState(null); // "donor" | "ngo" | "admin"
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Load cached profile instantly so the app doesn't flash a login
    // screen while Firebase is still resolving the session.
    (async () => {
      const cachedProfile = await getData(StorageKeys.USER_PROFILE);
      const cachedRole = await getData(StorageKeys.AUTH_ROLE);
      if (cachedProfile) setProfile(cachedProfile);
      if (cachedRole) setRole(cachedRole);
    })();

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const cachedRole = (await getData(StorageKeys.AUTH_ROLE)) || "donor";
        const collectionName =
          cachedRole === "admin" ? "admins" : cachedRole === "ngo" ? "ngos" : "users";
        const snap = await getDoc(doc(db, collectionName, firebaseUser.uid));
        if (snap.exists()) {
          setProfile(snap.data());
          setRole(cachedRole);
          await saveData(StorageKeys.USER_PROFILE, snap.data());
        }
      } else {
        setProfile(null);
        setRole(null);
      }
      setInitializing(false);
    });

    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, role, setProfile, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
