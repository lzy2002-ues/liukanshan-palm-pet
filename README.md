# 刘看山 AI 掌心陪伴萌宠

知乎黑客松 S3 项目协作仓库。

本项目围绕“掌心陪伴 → 私密倾诉 → 摇一摇奇遇 → 来信与共同记忆”构建。当前阶段先完成可演示的设备/浏览器 Mock、统一前后端字段和 ESP32 接入预留；不在客户端保存模型或知乎密钥。

## 从哪里开始读

1. [`docs/PRD-V1.0.md`](docs/PRD-V1.0.md)：当前产品基线。
2. [`docs/PRODUCT.md`](docs/PRODUCT.md)：早期产品背景与隐私边界。
3. [`docs/SHAKE_MODULE_API_CONTRACT.md`](docs/SHAKE_MODULE_API_CONTRACT.md)：摇一摇、六套匿名形象、助力与来信的联调字段。
4. [`docs/CONVERSATION_API_CONTRACT.md`](docs/CONVERSATION_API_CONTRACT.md)：按住说话、ASR、模型回复与会话 ID 字段。
5. [`docs/zhihu-integration.md`](docs/zhihu-integration.md)：知乎官方能力的接入边界。
6. [`AGENTS.md`](AGENTS.md)：让 Codex 参与开发前必须遵守的协作规则。

## 协作约定

- 每项开发从 `main` 新建 `codex/<scope>` 分支。
- 每次提交前同步 `main`，每个提交只处理一个清晰主题。
- 前后端跨端字段改动，必须同时更新对应的 `docs/*_API_CONTRACT.md`。
- 不提交 Token、OAuth secret、设备激活码、用户原始音频或私密对话。

## 本地预览摇一摇 Mock

```bash
npm install
npm run dev
```

打开终端显示的本地地址（默认 `http://127.0.0.1:5173`）。浏览器里可依次演示：

1. 选择六个固定匿名形象之一；
2. 在首页点击「进入对话」，再按住「按住说话」查看按钮内声波；上方在没有转写时不显示气泡框，松开后最多两行显示本轮用户说话，约 4.5 秒后连同气泡框一起消失；刘看山的回复保留到下一次回复；
3. 点击设备外的「模拟摇动设备」（实机由加速度计触发），先看到两只不同配色的形象在雪丘相遇，再单独看到对方形象与“匹配到×××”；约 1.6 秒后进入白框帖子信息页；
4. 在白框下方按住与「按住说话」同宽高的「按住助力」约 0.7 秒，看点赞图标从左向右推进与横向进度，随后显示发送结果；用右上角 × 返回首页。

验证命令：

```bash
npm test -- --run
npm run build
```

### 联调替换点

- 浏览器使用 [`src/api/conversationApi.ts`](src/api/conversationApi.ts) 和 [`src/api/encounterApi.ts`](src/api/encounterApi.ts) 的 Mock。已准备 [`src/api/httpAdapters.ts`](src/api/httpAdapters.ts) 对接转写、对话、摇动与助力四个后端路由；真实登录和服务端完成后注入 `App`，当前不自动启用。
- 首页同学的「进入对话」接 `open_conversation`；对话后端的 `session_id` 保留到摇动请求，聊天本身不会自动匹配。每页背景图从 [`src/theme/sceneAssets.ts`](src/theme/sceneAssets.ts) 替换，形象图从 [`src/components/AvatarCarousel.tsx`](src/components/AvatarCarousel.tsx) 替换。
- 浏览器触发传 `trigger_source: "mock"`；ESP32 固件在本地 IMU 判定摇动后传 `trigger_source: "imu"`。两端都使用相同的请求体，不在设备或浏览器保存知乎密钥。
- 对方字段固定为 `peer_author.anonymous_author_id`（内部匿名标识）、`peer_author.display_name`（界面昵称）和 `peer_author.pet_avatar_id`（六套形象 ID）；不下发真实用户 ID。六套图片只需替换 [`src/components/AvatarCarousel.tsx`](src/components/AvatarCarousel.tsx) 的 `avatarImageById` 映射。
- 本项目没有接入扬声器、真实录音、ASR、LLM、知乎 API 或 ESP32/LVGL 固件；首页使用项目提供的 384×317 雪丘 SVG，六个头像 ID 暂时共用一张刘看山透明处理图，正式六套形象待替换，详见 [`docs/asset-inventory.md`](docs/asset-inventory.md)。
- 产品匿名池帖子不附带知乎链接。只有知识奇遇可引导手机端打开真实知乎原文；当前仍是 Mock，不会声称已同步到知乎收藏。

