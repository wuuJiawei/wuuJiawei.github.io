# Deployment

- `../index.html`：当前 GitHub Pages 可直接访问的静态视觉验证版。
- 本目录：Expo / React Native 源码。

本地 Web：
```bash
npm install
npm run web
```

正常网络/CI 环境可生成真正 Expo Web 静态产物：
```bash
npx expo export --platform web
```
然后用 export 输出替换父目录的静态部署文件。

当前 Pages 版本不是伪装成 Expo export 的文件；它是为了在当前无法安装 npm 依赖的执行环境中，仍能立即访问和验证交互的独立静态构建。
