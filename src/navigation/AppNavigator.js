import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Public / marketing
import Home from "../screens/Home/Home";
import CampaignDetails from "../screens/Home/CampaignDetails";
import CampaignDirections from "../screens/Home/CampaignDirections";
import SearchNGOs from "../screens/Home/SearchNGOs";

// Auth (donor/recipient)
import Login from "../screens/Auth/Login";
import Register from "../screens/Auth/Register";
import ForgotPassword from "../screens/Auth/ForgotPassword";

// Donor
import DonorDashboard from "../screens/Donor/DonorDashboard";
import Donate from "../screens/Donor/Donate";
import DonationHistory from "../screens/Donor/DonationHistory";
import Events from "../screens/Donor/Events";
import Volunteer from "../screens/Donor/Volunteer";
import Notifications from "../screens/Donor/Notifications";
import Profile from "../screens/Donor/Profile";
import Settings from "../screens/Donor/Settings";

// NGO
import NGOLogin from "../screens/NGO/NGOLogin";
import NGORegister from "../screens/NGO/NGORegister";
import NGODashboard from "../screens/NGO/NGODashboard";
import CreateCampaign from "../screens/NGO/CreateCampaign";
import ManageCampaigns from "../screens/NGO/ManageCampaigns";
import ManageVolunteers from "../screens/NGO/ManageVolunteers";
import ManageEvents from "../screens/NGO/ManageEvents";
import NGOAnalytics from "../screens/NGO/NGOAnalytics";

// Admin
import AdminLogin from "../screens/Auth/AdminLogin";
import AdminDashboard from "../screens/Admin/AdminDashboard";

const Stack = createNativeStackNavigator();

// Every screen manages its own SafeAreaView/StatusBar/back button, so the
// stack header is hidden everywhere and each screen looks the same as the
// original hand-built designs.
export default function AppNavigator({ initialRouteName = "Home" }) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        {/* Public */}
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="CampaignDetails" component={CampaignDetails} />
        <Stack.Screen name="CampaignDirections" component={CampaignDirections} />
        <Stack.Screen name="SearchNGOs" component={SearchNGOs} />

        {/* Donor / recipient auth */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />

        {/* Donor area */}
        <Stack.Screen name="DonorDashboard" component={DonorDashboard} />
        <Stack.Screen name="Donate" component={Donate} />
        <Stack.Screen name="DonationHistory" component={DonationHistory} />
        <Stack.Screen name="Events" component={Events} />
        <Stack.Screen name="Volunteer" component={Volunteer} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Settings" component={Settings} />

        {/* NGO area */}
        <Stack.Screen name="NGOLogin" component={NGOLogin} />
        <Stack.Screen name="NGORegister" component={NGORegister} />
        <Stack.Screen name="NGODashboard" component={NGODashboard} />
        <Stack.Screen name="CreateCampaign" component={CreateCampaign} />
        <Stack.Screen name="ManageCampaigns" component={ManageCampaigns} />
        <Stack.Screen name="ManageVolunteers" component={ManageVolunteers} />
        <Stack.Screen name="ManageEvents" component={ManageEvents} />
        <Stack.Screen name="NGOAnalytics" component={NGOAnalytics} />

        {/* Admin area */}
        <Stack.Screen name="AdminLogin" component={AdminLogin} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
