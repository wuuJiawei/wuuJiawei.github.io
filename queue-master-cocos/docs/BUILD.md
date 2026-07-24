# 双平台构建说明

## 环境

- Cocos Dashboard
- Cocos Creator 3.8.8
- 微信开发者工具
- 抖音开发者工具

## 第一次打开

1. 在 Cocos Dashboard 中导入 `queue-master-cocos` 目录。
2. 使用 Cocos Creator 3.8.8 打开。
3. 等待 `library/` 和 `temp/` 首次导入完成。
4. 打开 `assets/main.scene`，点击预览即可运行。

工程使用 720 × 1280 竖屏设计分辨率。所有人物和界面均由 TypeScript + `Graphics` 动态绘制，不依赖外部美术资源。

## 构建微信小游戏

1. 菜单进入 **项目 → 构建发布**。
2. 平台选择 **微信小游戏**。
3. 填写微信小游戏 AppID。
4. 设备方向选择 **Portrait / 竖屏**。
5. 点击构建。
6. 使用微信开发者工具打开 `build/wechatgame`。

构建模板位于 `build-templates/wechatgame/game.json`。

## 构建抖音小游戏

1. 菜单进入 **项目 → 构建发布**。
2. 平台选择 **抖音小游戏**。
3. 填写抖音小游戏 AppID。
4. 设备方向选择 **Portrait / 竖屏**。
5. 点击构建。
6. 使用抖音开发者工具打开 `build/bytedance-mini-game`。

构建模板位于 `build-templates/bytedance-mini-game/game.json`。

## 平台能力

`PlatformService.ts` 统一封装：

- 微信 `wx` / 抖音 `tt` 运行环境识别
- 分享菜单
- 好友挑战参数
- 短震动反馈
- 启动参数解析

存档通过 Cocos 的 `sys.localStorage` 实现，Creator 会适配到对应小游戏平台。

## 上线前需要补充

- 在平台后台申请并填写正式 AppID。
- 配置合法请求域名和资源 CDN。
- 将模拟投票、幽灵对手替换为真实后端接口。
- 按平台审核要求补充隐私政策、用户协议和适龄提示。
- 接入平台登录、开放数据域排行榜、激励视频广告和支付。

## 官方资料

- Cocos Creator 3.8 自定义构建模板：
  <https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/custom-project-build-template.html>
- Cocos Creator 发布抖音小游戏：
  <https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-bytedance-mini-game.html>
