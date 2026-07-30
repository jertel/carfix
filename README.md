# CarFix / CarCommander

Modular vehicle programming and diagnostic application built with Vue 3, TypeScript, Quasar Framework, Pinia, and Capacitor for Web, Android, iOS, and Android Auto.

---

## 🛠 Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Android Studio** (Optional, for Android/Android Auto builds)
- **Xcode** (Optional, macOS only, for iOS builds)

---

## 🚀 Building & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Server
Start the local development server with hot reload:
```bash
npm run dev
```

### 3. Running Unit Tests
Execute the unit test suite via Vitest:
```bash
npm run test:unit
```

### 4. Production Web Build
Build production web assets into the `dist/` directory:
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```

### 5. Mobile App Builds (Capacitor)
Sync built web assets to native Android and iOS wrapper projects:
```bash
# Build web app first
npm run build

# Sync web build to native platforms
npx cap sync

# Open project in native IDEs
npx cap open android
npx cap open ios
```

---

## 📱 How to Use

### 🔌 1. Connect Tab
- Select your OBD-II hardware adapter (e.g., **OBDLink MX+**, **vLinker FS**, or **STN1170**).
- Click **Connect** to initialize UDS diagnostic session with the vehicle gateway over CAN bus.

### 🎛 2. Vehicle Options Tab
- Browse available configuration toggles for the detected vehicle module (e.g., **Ford F-150 Gen 14 BCM / APIM / IPC**).
- Available options include:
  - **Bambi Mode** (Fog lights remain on with high beams)
  - **Double Horn Honk Disable** (Disables double honk when exiting running vehicle with key fob)
  - **Auto Start-Stop Disable**
  - **Glare-Free / Matrix Headlights Enable**
  - **Secure Idle Enable**
- Toggling an option calculates UDS block addresses, updates hex bitmasks, computes CRC-16 checksums, automatically creates a safety backup, and writes to the module.

### 💾 3. Backups Tab
- View all automated and manual memory block backups taken prior to write operations.
- Inspect original vs modified hexadecimal block values.
- Restore previous block configurations to vehicle modules if needed.

### 🌗 4. Theme & Accessibility
- Use the theme toggle in the top bar to switch between **Light Mode** and **Dark Mode**.
- Meets 508 Level AA compliance and adapts seamlessly across desktop, tablet, and mobile screens.
