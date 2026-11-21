# SingWave 🎤 — Live Collaborative Karaoke Web App

A modern, real-time Karaoke party web application where party guests scan a QR code with their phones to request songs, select **Solo vs. Open Mic / Duet**, adjust **Pitch / Key Semitones**, and see the singer name and countdown displayed before the song plays!

---

## ✨ Features

- **📺 Host / Stage Screen (TV & Projector Mode)**:
  - Big vibrant party display with stage lights and neon aesthetic.
  - **Dynamic QR Code**: Displayed on-screen with direct room URL for instant phone camera scanning (no app required).
  - **Stage Announcement Curtain**: Before each song plays, an on-stage introduction card spotlights the singer's name, performance mode (Solo vs. Open Mic), requested pitch, dedication, and plays a 5-second animated countdown with celebration sounds and confetti!
  - **Embedded YouTube / YouTube Music Player**: Plays high-definition karaoke backing tracks with synchronized lyrics.
  - **Real-Time Key & Pitch Shifter**: Real-time semitone adjustment (-4 to +4 semitones) + playback speed/tempo controls (0.8x to 1.2x).
  - **Party Soundboard**: Instant crowd applause (👏), DJ airhorn (📢), cheer (🎉), drumroll (🥁), and fanfare (🎺) powered by Web Audio API synthesis.
  - **Live Queue Management**: Reorder, jump to song, delete, or add songs from the catalog.

- **📱 Guest Mobile Request Portal (QR Code Landing Page)**:
  - Works on any mobile browser (iOS Safari, Android Chrome).
  - **Singer Name**: Remembered across requests.
  - **Performance Mode**:
    - **Solo 🎤**: For singers wanting the solo spotlight.
    - **Open Mic / Duet 👥**: Invites anyone at the party to join in.
  - **Key & Pitch Shifter**: Choose your vocal range preference (-4, -2, -1, 0, +1, +2, +4 semitones) before requesting.
  - **Song Search & Catalog**: 
    - Search over 80 curated karaoke crowd-pleasers by category (Pop, Rock, 80s/90s, Duets, Disney, Ballads).
    - Custom YouTube or YouTube Music URL/ID paste.
  - **Live Queue & Duet Hub**:
    - Displays queue position (e.g., *"You are #2 in line (approx 4 mins)"*).
    - Upvote songs in queue.
    - **"Join as Duet Partner"** button for any Open Mic performance!

- **🔥 Firebase & Google Integration**:
  - **Zero-Config Real-Time Sync**: Works out-of-the-box locally and on Wi-Fi using BroadcastChannel and LocalStorage sync.
  - **Firebase Cloud Firestore**: Real-time remote sync across cellular and multiple networks.
  - **Google Sign-In**: Authenticate hosts and save room history.
  - In-app Firebase Settings modal to enter Firebase credentials at any time.

---

## 🚀 Running the App

```bash
# 1. Start the development server
npm run dev
```

- **Local Host URL**: `http://localhost:3000/`
- **Network / Mobile URL**: `http://192.168.0.101:3000/?room=PARTY-88&view=guest` (auto-embedded into the on-screen QR code)

---

## ☁️ Deploying to Firebase Hosting

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in this folder
firebase init

# Build production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

