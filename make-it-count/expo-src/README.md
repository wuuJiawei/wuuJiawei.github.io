# Make it Count

> Don't count time. Make it count.

A cross-platform visual prototype for an outcome-first focus app. The app turns each real-world accomplishment into a collectible object that gradually fills a personal room.

## Product loop

1. Define what you will finish.
2. Define what “done” looks like.
3. Focus while the workshop object takes shape.
4. Record what actually happened.
5. Reveal a collectible with a completion ritual.
6. Place it in the room; tap it later to recall the real accomplishment behind it.

## Art direction

**Warm Editorial Craft** — hand-drawn, non-pixel, warm paper, ink, terracotta, forest green, wood, and restrained motion. The room is the main visual/game layer; the UI intentionally avoids dashboard-card density, neon gradients, fake glassmorphism, and emoji-as-icons.

## Stack

- Expo / React Native / React Native Web
- React Native Skia for the cross-platform workshop scene and collectible artwork
- Reanimated for character motion, reveal, confetti, transitions
- Rive runtime is retained for a future reviewed local `.riv` asset; the previous remote community emoji animation was removed because it did not match the art direction

## Run

```bash
npm install
npm run web
```

Native development requires an Expo development build rather than Expo Go because Skia/Rive include native code.

## Repository layout when published

- `make-it-count/expo-src/` — this source project
- `make-it-count/index.html` — dependency-free GitHub Pages build for direct visual/product validation
- `make-it-count/expo-src/assets/open-doodles/` — local CC0 hand-drawn assets reused by the Web build

## Design verification

The direct web build exposes deterministic review states through `?screen=`:

- `?screen=setup`
- `?screen=focus`
- `?screen=result`
- `?screen=reveal`
- `?screen=room`

This makes visual regression review possible without waiting through a focus session.
