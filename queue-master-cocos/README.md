# 排队大师 Cocos Creator

《排队大师》的 Cocos Creator 3.8.8 双平台项目，目标平台：

- 微信小游戏：`wechatgame`
- 抖音小游戏：`bytedance-mini-game`

## 已迁移功能

- 5 章、30 个数据化主线关卡
- 数量、生存、零失误、连击、指定对象 5 种关卡目标
- 客观、组合、推测、争议规则
- 模糊区间不判错
- 三星评价、金币、章节解锁
- 每日 3 道固定争议题
- 固定种子异步 PK、幽灵对手、挑战分享
- 8 个职场段位、挑战券
- 办公室升级、人物图鉴
- 本地存档与每日恢复
- 微信/抖音分享、震动、启动参数平台适配

## 工程设计

```text
assets/scripts
├── GameTypes.ts          领域类型
├── GameData.ts           人物、规则、关卡、判定
├── StorageService.ts     本地存档
├── PlatformService.ts    wx / tt 平台适配
├── UIFactory.ts          Cocos Graphics 动态 UI
└── QueueMasterApp.ts     页面与核心游戏循环
```

只保留一个 `main.scene`。场景节点、人物和界面运行时动态生成，方便快速验证和后续替换正式美术。

## 打开项目

使用 **Cocos Creator 3.8.8** 打开本目录，然后打开 `assets/main.scene`。

详细构建步骤见 [docs/BUILD.md](docs/BUILD.md)。

## 本地结构校验

```bash
npm install
npm run validate
```

该命令检查必需工程文件、JSON、TypeScript 语法以及 Cocos Creator 3.8 API 类型。正式运行和小游戏构建必须使用 Cocos Creator。

## 当前边界

这是前端玩法验证版。投票比例、幽灵对手仍是固定种子模拟数据；真实账号、全服投票、排行榜、跨设备存档、广告和支付需要后端及平台 AppID 后再接入。
