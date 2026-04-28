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

## Building for production

```bash
# Web export (static files in dist/)
npx expo export --platform web

# Native builds (requires EAS or local Xcode / Android SDK)
npx expo run:ios
npx expo run:android
```

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
