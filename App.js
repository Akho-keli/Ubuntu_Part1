import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { LoadingOverlay } from "./src/components/Feedback";

// Decides which screen a returning (already-logged-in) user lands on,
// based on the role cached in AsyncStorage + confirmed by Firebase Auth.
// A brand-new user with no session simply starts at Home.
function Root() {
  const { initializing, role, user } = useAuth();
  const { colors, mode } = useTheme();

  if (initializing) {
    return <LoadingOverlay label="Loading UbuntuCare..." />;
  }

  let initialRouteName = "Home";
  if (user && role === "donor") initialRouteName = "DonorDashboard";
  else if (user && role === "ngo") initialRouteName = "NGODashboard";
  else if (user && role === "admin") initialRouteName = "AdminDashboard";

  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <AppNavigator initialRouteName={initialRouteName} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </ThemeProvider>
  );
}
