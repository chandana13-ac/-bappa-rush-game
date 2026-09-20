# 🐘 Bappa Rush: The Great Festival Challenge

A stable, polished, family-friendly 3D browser festival game celebrating Ganesh Chaturthi utsav preparations. Built with React, TypeScript, Vite, Three.js, and browser `localStorage`.

---

## 🌟 Game Overview

In **Bappa Rush**, you step into the shoes of an energetic festival volunteer on the eve of the grand evening arti and procession. Walk through the beautifully lit festival courtyard, approach five specialized festival stations, and keep the celebration running smoothly before time runs out!

### 🎪 Festival Stations
1. **Diya Dash (`diyaDash`)**: Sprint along the procession corridor to light sacred brass oil lamps.
2. **Rangoli Recall (`rangoliRecall`)**: Memorize and recreate symmetric floral rangoli floor art with vibrant gulal powders.
3. **Modak Factory (`modakFactory`)**: Catch and shape steaming sweet rice flour modak offerings.
4. **Dhol Echo (`dholEcho`)**: Keep rhythm with thunderous traditional festival drum beats.
5. **Pandal Perfect (`pandalPerfect`)**: Decorate the grand stage with fresh marigold torans and decorative arches.

---

## 🎮 Controls

- **Move**: `W`, `A`, `S`, `D` or `Arrow Keys`
- **Orbit Camera**: Click & Drag mouse / Swipe on touchscreen
- **Camera Zoom**: Mouse Scroll wheel
- **Interact with Station**: `E` key or on-screen Interact button
- **Pause Festival**: `Escape` key or top-right Pause icon
- **Mobile / Touch**: On-screen analog joystick and touch interact button

---

## 🏗️ Architecture & State Machine

The game engine operates on a robust, single-active state machine:

- `BOOT`: Initial loading screen with animated progress bar
- `MAIN_MENU`: Festive nighttime pandal background, sound hooks, and mode selection
- `TUTORIAL`: Step-by-step card guide explaining movement, stations, score, combo, chaos, and pause
- `FESTIVAL_HUB`: Walkable 3D festival plaza with 5 glowing stations, Bappa sanctuary, and marigold garlands
- `MINI_GAME`: Station preview & gameplay mode with clean resource teardown
- `RANDOM_EVENT` & `CHAOS_MODE`: Dynamic crowd excitement meters
- `FINAL_REVEAL` & `RESULTS`: Evening arti scoring, coin rewards, and summary
- `PAUSED`: Stops all gameplay timers and halts active loops safely
- `GAME_OVER`: Festive wrap-up and score registration

---

## 🛠️ Project Structure

```
src/
  game/
    GameState.ts          # State machine enum and objective types
    GameManager.ts        # Central state coordinator and minigame lifecycle
    TimerManager.ts       # Countdown timer with pause/resume support
    ScoreManager.ts       # Score, coins, combo multiplier, and chaos meter
    SaveManager.ts        # Browser localStorage persistence
    SettingsManager.ts    # Audio, graphics, and camera settings
    AudioManager.ts       # Web Audio API procedural sound synthesizer
  scene/
    FestivalHub.ts        # Three.js nighttime pandal, lighting, particles
    PlayerController.ts   # Low-poly volunteer character & movement
    CameraController.ts   # 3rd-person orbital camera
    InteractionSystem.ts  # Proximity detection and station trigger events
  minigames/
    diyaDash/             # Diya Dash module
    rangoliRecall/        # Rangoli Recall module
    modakFactory/         # Modak Factory module
    dholEcho/             # Dhol Echo module
    pandalPerfect/        # Pandal Perfect module
  ui/
    LoadingScreen.tsx     # Boot screen
    MainMenu.tsx          # Main festival menu
    TutorialModal.tsx     # How to play cards carousel
    HUD.tsx               # In-game heads-up display
    PauseMenu.tsx         # Pause dialog with quit confirmation
    SettingsModal.tsx     # Volume and sensitivity controls
    HighScoreModal.tsx    # Hall of Fame leaderboard
    DevTestModal.tsx      # Development test launcher
    MinigamePreviewModal.tsx # Station preview and practice
    ResultsScreen.tsx     # Festival results and replay
    ErrorBoundary.tsx     # Friendly crash recovery screen
  components/
    FestivalCanvas.tsx    # Three.js mount container
    TouchControls.tsx     # Accessible virtual joystick
  data/
    festivalData.ts       # Station positions, info, and tutorial text
  styles/
    festivalTheme.ts      # Festive color palette constants
```

---

## 🔧 Technical Highlights

- **100% Procedural 3D Geometry**: No external 3D model downloads; crafted with Three.js primitives, custom materials, and particle emitters.
- **Synthesized Audio**: Procedural sound effects and drone chords generated via browser `AudioContext` without external sound assets.
- **Graceful Audio Fallback**: Runs completely seamlessly even if audio is muted or blocked.
- **Zero External API / No Database**: Runs completely client-side with persistent `localStorage`.
