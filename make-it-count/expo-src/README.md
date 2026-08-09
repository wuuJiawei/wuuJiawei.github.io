# Make it Count — Expo / React Native prototype

> Don't count time. Make it count.

同一套产品代码目标：iOS / Android / Web。

## Stack
- Expo + React Native / React Native Web
- React Native Skia：工坊、收藏品、光影
- Reanimated：角色浮动、揭晓、粒子、转场
- Rive：Web / Native 分平台 runtime
- Open Doodles：CC0 手绘角色素材

## Run
```bash
npm install
npm run web
```
演示时选择 **10s**。

## iOS
Rive 含原生代码，使用 development build：
```bash
npx expo prebuild
npx expo run:ios
```

目录：`src/App.tsx` 是产品闭环；`WorkshopScene` 是 Skia + Reanimated 场景；`RiveCompanion.web/native.tsx` 隔离 Rive runtime。
