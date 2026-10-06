# UbuntuCare — NGO Donation & Volunteering App

A React Native (Expo) mobile app connecting **Donors**, **NGOs**, and **Platform Admins**,
fully backed by **Firebase** (Auth + Firestore + Storage), with **AsyncStorage** for
offline caching/session persistence, **push notifications**, and **two external APIs**.

---

## 1. Quick Start

This project targets **Expo SDK 57**. On Windows, keep the working copy outside
OneDrive and other cloud-synced folders. Metro's file watcher can fail while a
sync client changes files during bundling.

Copy or move the project to a local folder such as `C:\Dev\UbuntuCareApp`, then
install the locked dependencies and start Expo Go:

```powershell
Set-Location C:\Dev\UbuntuCareApp
npm ci
npx expo start --go --clear
```

Scan the QR code with **Expo Go** on a device connected to the same network.

### Firebase setup (required before anything will actually work)

1. Create a project at https://console.firebase.google.com
2. Enable **Authentication → Email/Password**.
3. Create a **Firestore Database** (production mode).
4. Enable **Storage**.
5. Add a Web App in Project Settings → copy the config object into
   `src/firebase/firebaseConfig.js` (replace the `YOUR_...` placeholders).
6. Deploy the security rules included in this project:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init   # select Firestore, Storage, Functions — point at this folder
   firebase deploy --only firestore:rules,storage:rules
   ```
7. (Optional but recommended) Deploy the Cloud Functions in `/functions` — see §5.

Firestore collections are created automatically the first time the app writes to
them — you don't need to manually create `users`, `campaigns`, etc. The full schema
is documented at the bottom of `src/firebase/firebaseConfig.js`.

---

## 2. Project Structure

```
UbuntuCareApp/
├── App.js                       # Entry point — providers + session-aware routing
├── app.json                     # Expo config (permissions, plugins, icons)
├── firebase.json                # Firebase CLI config (rules + functions)
├── firestore.rules              # Firestore security rules
├── storage.rules                # Storage security rules
├── functions/                   # Cloud Functions (Paystack verify + push fan-out)
├── src/
│   ├── firebase/firebaseConfig.js
│   ├── context/
│   │   ├── AuthContext.js       # Firebase session + role + cached profile
│   │   └── ThemeContext.js      # Light/dark mode (persisted)
│   ├── services/
│   │   ├── authService.js       # register/login/logout for donor, NGO, admin
│   │   ├── firestoreService.js  # every Firestore read/write in the app
│   │   ├── storageService.js    # image upload → Firebase Storage
│   │   ├── notificationService.js # push notification registration
│   │   ├── currencyApi.js       # EXTERNAL API #1 — live exchange rates
│   │   ├── geocodeApi.js        # EXTERNAL API #2 — address → lat/lng
│   │   └── paymentService.js    # Paystack checkout helpers
│   ├── utils/
│   │   ├── storage.js           # AsyncStorage wrapper + all cache keys
│   │   └── validators.js        # form validation + friendly Firebase errors
│   ├── components/              # Button, Input, LoadingOverlay, EmptyState
│   ├── navigation/AppNavigator.js
│   └── screens/
│       ├── Home/                # Home, CampaignDetails, SearchNGOs
│       ├── Auth/                # Login, Register, ForgotPassword, AdminLogin
│       ├── Donor/                # Dashboard, Donate, History, Events, Volunteer, Notifications, Profile, Settings
│       ├── NGO/                  # Login, Register, Dashboard, CreateCampaign, ManageCampaigns, ManageVolunteers, ManageEvents, Analytics
│       └── Admin/AdminDashboard.js
```

---

## 3. Feature List

### Donor / Recipient
- Email/password registration & login (Firebase Auth), forgot-password email reset
- Session persists across app restarts (Firebase Auth + AsyncStorage)
- Browse & search live, admin-approved campaigns with real-time progress bars
- Campaign detail page with **live-updating** raised amount (Firestore `onSnapshot`)
- Donate flow: preset/custom amounts, **live currency conversion** (API #1),
  in-app Paystack checkout (WebView), donation draft auto-saved to AsyncStorage
  so nothing is lost if the app is backgrounded mid-donation
- Donation history
- Find verified NGOs (search by name/category, shows geocoded address)
- Volunteer application flow (choose NGO, skills, availability)
- Upcoming NGO events, RSVP-ready data model
- Push + in-app notifications (device token saved to Firestore)
- Editable profile with photo upload (Firebase Storage)
- Settings: dark mode toggle, clear offline cache, logout
- Offline support: campaigns list is cached in AsyncStorage and shown instantly
  (with a banner) if Firestore can't be reached

### NGO Partner
- NGO registration with **address geocoding** (API #2) for "NGOs near me"
- Pending-verification banner until an admin approves the NGO
- Dashboard with total raised + live campaign count
- Create / edit / delete campaigns (with cover image upload)
- Manage campaigns list with live status pills (pending/approved/rejected)
- Review & approve/decline volunteer applications
- Create and manage events
- Analytics screen: bar chart of funds raised per campaign, average progress,
  totals (via `react-native-chart-kit`)

### Admin — fully real-time (Firestore `onSnapshot`, no manual refresh needed)
- Dedicated admin login; admin accounts are provisioned through the trusted
  Firebase Admin SDK and cannot be self-registered from the client
- **Overview**: live platform-wide stats (users, an *estimated "active now"*
  count derived from the live activity feed, NGOs, live campaigns, total
  raised, open reports, blocked users) + an "attention" queue of pending approvals
- **Users — full real-time CRUD**:
  - **Create**: add a brand-new donor account (real Firebase Auth login +
    Firestore profile) without disturbing the admin's own session, via a
    Cloud Function running the Admin SDK
  - **Read**: live list, updates instantly the moment any user registers,
    changes, or is edited/blocked/deleted from any admin device
  - **Update**: edit a user's name/phone in place
  - **Delete**: permanently removes both their Auth login and Firestore
    profile together (Cloud Function), so no orphaned accounts are left behind
  - Block/unblock accounts
- **NGOs**: live list, verify/unverify (gates whether their campaigns go public)
- **Campaigns**: live list, approve / reject / delete any submitted campaign,
  now also shows each campaign's contact number and address
- **Donations**: live, full transaction ledger across the whole platform
- **Reports**: live moderation queue for user-filed reports, mark resolved
- **Broadcast**: send a platform-wide push + in-app notification to every user
- **Activity — real-time login/logout/change trail**: every account (donor,
  NGO, admin) writes an entry here the moment they log in, log out, register,
  update their profile, create a campaign, call a campaign organizer, or
  request/play directions — visible to admins **live**, with who, what, and
  exactly what time, searchable by name/email
- **Audit Log**: immutable record of every *admin* action specifically (who
  approved/blocked/deleted what)
- Pull-to-refresh everywhere, badge counts on tabs needing attention

### People in Need — reach help and get there
- Every campaign's detail page shows the organizing NGO, a **Call Organizer**
  button (opens the phone dialer directly — `tel:`), and a **Get Directions**
  button
- **Voice-guided directions**, two ways:
  1. **In-app**: calculates the route from the person's current location
     (`expo-location`) to the campaign address (API #3, see below), shows
     distance/ETA and full step-by-step text directions, and can **read the
     entire route aloud** with `expo-speech` — useful for anyone who can't
     read the screen while walking/driving, or has low literacy/vision
  2. **Native GPS handoff**: a "Start Voice-Guided GPS Navigation" button
     launches the phone's own Maps app (Google Maps on Android, Apple Maps
     on iOS) directly into turn-by-turn navigation mode with continuous
     spoken directions — the same experience as any GPS app

### Cross-cutting
- **Firebase**: Auth (3 account types sharing one Auth pool, separate Firestore
  collections `users` / `ngos` / `admins`), Firestore (10 collections), Storage
- **AsyncStorage**: session cache, theme, "remember me" email, offline campaign/NGO
  cache, in-progress donation draft, onboarding flag — single wrapper in `utils/storage.js`
- **Push notifications**: `expo-notifications`, token saved per-account, a Cloud
  Function fans broadcast/targeted notifications out via Expo's push API
- **External API #1 — exchangerate-api.com (open, keyless)**: live currency
  conversion so donors can see amounts in their own currency
- **External API #2 — OpenStreetMap Nominatim (keyless)**: geocodes NGO and
  campaign addresses for location display and "get directions"
- **External API #3 — OSRM routing (keyless)**: turns a start point +
  destination into distance, ETA, and turn-by-turn steps for the in-app
  voice/text directions screen
- **Payments**: Paystack inline checkout via WebView; the raw secret key never
  ships in the app — a Cloud Function verifies transactions server-side
- Light/dark theme, persisted and toggleable from Settings
- Security rules (Firestore + Storage) enforcing ownership and role checks —
  e.g. only an admin can flip a campaign's `status` or a user's `blocked` flag

---

## 4. Role Model

All three account types are Firebase Auth users, but their profile documents
live in **separate collections** so security rules can gate admin/NGO-only
actions independently:

| Role   | Firestore collection | Provisioning              |
|--------|-----------------------|---------------------------|
| Donor  | `users/{uid}`          | `authService.registerUser` |
| NGO    | `ngos/{uid}`           | `authService.registerNgo`  |
| Admin  | `admins/{uid}`         | Provisioned out-of-band with Firebase Admin SDK |

On relaunch, `AuthContext` restores the cached role from AsyncStorage, confirms
it against the matching Firestore doc, and `App.js` routes a returning user
straight to their dashboard.

To provision an administrator, create their Firebase Authentication account
and matching `/admins/{uid}` profile with the Firebase Admin SDK in a trusted
environment. Client Firestore rules intentionally prohibit writing admin
documents; do not add an admin signup code or expose Admin SDK credentials in
the app.

---

## 5. Deploying the Cloud Functions (optional, for real payments + push)

```bash
cd functions
npm install
firebase functions:config:set paystack.secret="sk_live_xxxxxxxx"
firebase deploy --only functions
```

This deploys:
- `verifyPaystackTx` — server-side transaction verification (keeps your secret
  key off the device)
- `sendPushOnNotificationCreate` — a Firestore trigger that turns every new
  `/notifications` doc into a real Expo push notification
- `adminCreateUser` / `adminDeleteUser` — callable functions the Admin
  "Users" tab uses to create or permanently delete a donor's real Auth
  login + Firestore profile together

If you skip this step, the app still fully works for browsing, auth, campaigns,
Firestore-backed in-app notifications, admin **block/unblock/edit**, etc. —
only *server-verified* payments, *real device push delivery*, and the admin's
**Create User** / **Delete User** buttons need the functions deployed. (If
`adminDeleteUser` isn't deployed yet, Delete falls back to removing just the
Firestore profile so the admin action still takes local effect.)

---

## 6. Known Placeholders to Fill In Before Production

- `src/firebase/firebaseConfig.js` → your real Firebase config
- `src/services/paymentService.js` → your real Paystack **public** key
- App icons/splash in `app.json` (currently uses Expo defaults)
