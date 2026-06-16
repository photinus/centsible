# Centsible — Setup Guide

## Prerequisites
- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli eas-cli`
- Android Studio (for Android emulator) or a physical Android device with Expo Go

---

## 1. Install Dependencies

```bash
cd Centsible
npm install
```

---

## 2. Configure Firebase

### 2a. Create a Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (e.g. "centsible-family")
3. Enable **Authentication** → Sign-in method → **Email/Password**
4. Create a **Firestore Database** (start in Production mode, choose a region)

### 2b. Add a Web App
1. In Project Settings → Your apps → Add app → Web
2. Copy the `firebaseConfig` object into `services/firebase.ts`

### 2c. Add an Android App (for the native build)
1. In Project Settings → Your apps → Add app → Android
2. Use package name `com.centsible.app`
3. Download `google-services.json` and place it in the project root

### 2d. Firestore Security Rules
In Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Households: readable/writable by any authenticated user in the household
    match /households/{householdId} {
      allow read, write: if request.auth != null;
    }
    match /members/{memberId} {
      allow read, write: if request.auth != null;
    }
    match /transactions/{txId} {
      allow read, write: if request.auth != null;
    }
    match /chores/{choreId} {
      allow read, write: if request.auth != null;
    }
    match /choreCompletions/{id} {
      allow read, write: if request.auth != null;
    }
    match /goals/{goalId} {
      allow read, write: if request.auth != null;
    }
    match /recurringDeposits/{id} {
      allow read, write: if request.auth != null;
    }
  }
}
```

> **Note:** Tighten these rules for production — scope reads/writes to `householdId` fields.

---

## 3. Run the App

### Web (browser)
```bash
npm run web
# Opens at http://localhost:8081
```

### Android (with Expo Go)
```bash
npm run android
# Scan the QR code with the Expo Go app on your Android device
```

### Android (standalone APK via EAS)
```bash
eas build --platform android --profile preview
```

---

## 4. First-Time Setup Flow

1. Open the app → tap **Parent Login**
2. Tap **"New family? Create an account"**
3. Fill in your name, household name, email, and password
4. You'll land on the **Parent Command Center**
5. Go to **Settings** → **Add a Child** (set their name, avatar, and 4-digit PIN)
6. Note your **Household ID** shown at the top of Settings
7. On a kid's device, tap **"I'm a Kid"** → enter the Household ID → pick their name → enter PIN

---

## 5. Project Structure

```
app/                    # Expo Router file-based routes
  (auth)/               # Login, setup, kid PIN screen
  (kid)/                # Kid-facing screens (home, chores, activity, goals)
  (parent)/             # Parent screens (dashboard, family, approvals, chores, settings)
components/
  shared/               # Reusable UI (Sidebar, BottomTabBar, Card, Button, SparkLine…)
  kid/                  # Kid-specific components
  parent/               # Parent-specific components
constants/              # Theme colors, typography, spacing, icon lists
hooks/                  # useAuth, useResponsive, useHousehold
services/               # Firebase init, auth, Firestore CRUD, offline queue
store/                  # Zustand state (authStore, dataStore)
types/                  # TypeScript interfaces
```

---

## 6. Key Features

| Feature | Details |
|---|---|
| **Kid home** | Total stash balance, Spend/Save/Give accounts, Deposit/Withdraw requests |
| **Chores** | Phone list + Tablet master-detail view, submit for parent approval |
| **Goals** | Set savings targets with emoji icons, contribute from Save account |
| **Activity** | Filterable transaction history, pending badges |
| **Parent dashboard** | Approval hub for all pending transactions and chore completions |
| **Family overview** | Side-by-side child columns with sparkline charts and goals |
| **Chores Market** | Create/edit/delete chore templates, assign to specific kids |
| **Allowance** | Configurable recurring deposits (weekly/biweekly/monthly), auto-processed on app open |
| **Interest** | Configurable annual rate paid monthly to Save accounts |
| **Offline** | Firestore offline persistence + AsyncStorage action queue, auto-syncs when back online |
| **Responsive** | Bottom tabs on phones, sidebar nav on tablets/desktop (≥600px) |
