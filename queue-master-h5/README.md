# 排队大师 H5

一款从客观分类逐渐演变为荒诞职场判断的 60 秒轻度 H5 游戏。

- 在线试玩：<https://wuujiawei.github.io/queue-master-h5/>
- 技术栈：React 19、TypeScript、Vite
- 操作：手机左右滑动；电脑可点击队伍或使用 `A/D`、方向键

## 目录说明

- `index.html`、`assets/`：GitHub Pages 使用的编译产物
- `source/`：完整项目源码
- `source/src/App.tsx`：人物生成、规则、判定和游戏状态
- `source/src/index.css`：人物绘制和全部界面样式

## 本地运行

```bash
cd source
npm install
npm run dev
```

## 构建

```bash
cd source
npm run build
```

构建结果会生成在 `source/dist/`。发布到当前 GitHub Pages 目录时，需要将其中的文件复制到上一级 `queue-master-h5/`。
