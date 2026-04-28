# Qul Reader

A cross-platform mobile reader for the 306 Quranic "Qul" (Say) passages, built with React Native and Expo.

## Features

- **17 English translations** — switch between translations via a horizontally scrollable picker
- **Qul highlighting** — toggle to highlight only the imperative "Say …" portion of each passage (narrative context stays plain)
- **Font choice** — System, Serif, or Noto Serif
- **Cross-ayah awareness** — multi-ayah spans are rendered together; highlighting tracks quote boundaries across ayah breaks

## Project structure

```
qul-reader/
├── App.tsx                          # Entry point — state, FlatList, settings
├── src/
│   ├── types/index.ts               # TypeScript interfaces (QulPassage, ReaderSettings, etc.)
│   ├── data.ts                      # Translation registry and data loader
│   └── components/
│       ├── PassageCard.tsx           # Renders a single passage card with highlight segmentation
│       └── SettingsBar.tsx           # Translation picker, highlight toggle, font picker
├── assets/data/
│   └── en.*.json                    # Pre-generated passage data per translation (17 files)
├── tsconfig.json
└── package.json
```

## Prerequisites

- **Node.js** ≥ 18 (tested with v24)
- **npm** ≥ 9
- **Expo CLI** — installed automatically via `npx`

## Getting started

```bash
# Install dependencies
npm install

# Start the dev server (opens QR code for Expo Go + web)
npx expo start

# Or start directly in a browser
npx expo start --web
```

The web version runs at `http://localhost:8081` by default.

## Previewing on a device

### With Expo Go (quickest)

1. Install **Expo Go** from the App Store (iOS) or Google Play (Android).
2. Run `npx expo start` on your dev machine.
3. Scan the QR code shown in the terminal:
   - **Android** — use the Expo Go app's scanner.
   - **iOS** — use the built-in Camera app; it will offer to open in Expo Go.
4. The app loads over your local network. Changes hot-reload automatically.

> Your phone and dev machine must be on the same Wi-Fi network. If you're behind a firewall or VPN, use `npx expo start --tunnel` (requires `@expo/ngrok`).

### In a simulator / emulator

```bash
# iOS Simulator (macOS only, requires Xcode)
npx expo start --ios

# Android Emulator (requires Android Studio + an AVD)
npx expo start --android
```

## Building for production

```bash
# Web export (static files in dist/)
npx expo export --platform web
```

### Packaging native builds with EAS

[EAS Build](https://docs.expo.dev/build/introduction/) is Expo's cloud build service. It produces `.ipa` (iOS) and `.apk` / `.aab` (Android) files without requiring local Xcode or Android SDK installs.

```bash
# One-time setup
npm install -g eas-cli
eas login
eas build:configure   # generates eas.json

# Development build (installable, includes dev tools)
eas build --platform ios --profile development
eas build --platform android --profile development

# Production build
eas build --platform ios --profile production
eas build --platform android --profile production
```

After the build completes, EAS provides a download link. For iOS production builds you'll also need an Apple Developer account ($99/year) to sign and submit to the App Store.

### Local native builds (no EAS)

If you prefer to build locally:

```bash
# Generate native projects (creates ios/ and android/ dirs)
npx expo prebuild

# iOS (macOS only — requires Xcode and CocoaPods)
cd ios && pod install && cd ..
npx expo run:ios --configuration Release

# Android (requires Android SDK and JDK 17+)
npx expo run:android --variant release
```

### Deploying to devices

| Target | Method |
|--------|--------|
| **iOS (TestFlight)** | Upload the `.ipa` from EAS or Xcode to App Store Connect → TestFlight. Testers install via the TestFlight app. |
| **iOS (Ad Hoc)** | Register device UDIDs in your Apple Developer portal, rebuild with an ad-hoc provisioning profile, then share the `.ipa` directly. |
| **Android (direct install)** | Download the `.apk` onto the device and open it (enable "Install unknown apps" in settings). |
| **Android (Play Store)** | Upload the `.aab` to the Google Play Console for internal testing or production release. |
| **EAS Update (OTA)** | After the initial native build, push JS-only updates without rebuilding: `eas update --branch production`. |

## Regenerating passage data

The `assets/data/en.*.json` files are produced by the Python pipeline in the parent directory. To regenerate after adding a new translation:

1. Download the translation JSON from api.alquran.cloud into `../files/`:
   ```bash
   curl -s "https://api.alquran.cloud/v1/quran/en.EDITION" -o ../files/en.EDITION.json
   ```

2. Add the file path to the `TRANSLATIONS` list in `../find_qul_spans_consensus.py` and run it:
   ```bash
   python3 ../find_qul_spans_consensus.py
   ```

3. Extract passages:
   ```bash
   python3 ../extract_qul_ayahs_from_translation.py ../files/en.EDITION.json
   ```

4. Copy the output into `assets/data/`:
   ```bash
   cp ../qul_passages_en.EDITION_*.json assets/data/en.EDITION.json
   ```

5. Register the new translation in `src/data.ts` (add an import and a `TRANSLATIONS` entry).
