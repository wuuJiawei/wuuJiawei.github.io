# 排队大师 H5

一款从客观分类逐渐演变为荒诞职场判断的轻竞技 H5 游戏。

- 在线试玩：<https://wuujiawei.github.io/queue-master-h5/>
- 技术栈：React 19、TypeScript、Vite
- 操作：手机左右滑动；电脑可点击队伍或使用 `A/D`、方向键

## V2 已实现

- 5 章、30 个数据化主线关卡
- 数量、生存、零失误、连击、指定对象 5 种目标
- 三星评价、金币奖励和章节解锁
- 每日 3 道固定争议题
- 固定种子的异步 PK、幽灵对手和挑战链接
- 8 个职场段位、挑战券与赛季界面
- 办公室升级、人物图鉴和浏览器本地存档

当前为无需后端的玩法验证版。“全服比例”和幽灵对手使用确定性模拟数据，跨设备账号、真实排行榜和投票聚合尚未接入。

## 目录说明

- `index.html`、`assets/`：GitHub Pages 使用的编译产物
- `source/`：完整项目源码
- `source/src/App.tsx`：页面、对局与产品循环
- `source/src/game.ts`：人物、规则、关卡和存档数据
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
