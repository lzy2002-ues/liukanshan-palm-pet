# 刘看山 AI 掌心陪伴萌宠

知乎黑客松 S3 项目协作仓库。

本项目围绕“掌心陪伴 → 私密倾诉 → 摇一摇奇遇 → 来信与共同记忆”构建。当前阶段先完成可演示的设备/浏览器 Mock、统一前后端字段和 ESP32 接入预留；不在客户端保存模型或知乎密钥。

## 从哪里开始读

1. [`docs/PRD-V1.0.md`](docs/PRD-V1.0.md)：当前产品基线。
2. [`docs/PRODUCT.md`](docs/PRODUCT.md)：早期产品背景与隐私边界。
3. [`docs/SHAKE_MODULE_API_CONTRACT.md`](docs/SHAKE_MODULE_API_CONTRACT.md)：摇一摇、六套匿名形象、助力与来信的联调字段。
4. [`docs/zhihu-integration.md`](docs/zhihu-integration.md)：知乎官方能力的接入边界。
5. [`AGENTS.md`](AGENTS.md)：让 Codex 参与开发前必须遵守的协作规则。

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
2. 模拟按住说话，看到一条短对话与知乎经验卡；
3. 点击“摇一摇遇见”，得到匿名情绪奇遇；
4. 送出鼓励，查看模拟的“刘看山来信”。

验证命令：

```bash
npm test -- --run
npm run build
```

### 联调替换点

- 浏览器 Mock 的唯一接口替换点是 [`src/api/encounterApi.ts`](src/api/encounterApi.ts)。真实后端接入时保留 [`src/contracts.ts`](src/contracts.ts) 的字段，并将 Mock 函数替换为对 `POST /encounters/shake` 与 `POST /encounters/{encounter_id}/support` 的调用。
- 浏览器触发传 `trigger_source: "mock"`；ESP32 固件在本地 IMU 判定摇动后传 `trigger_source: "imu"`。两端都使用相同的请求体，不在设备或浏览器保存知乎密钥。
- 本项目没有接入扬声器、真实录音、ASR、LLM、知乎 API 或 ESP32/LVGL 固件；六个形象现为可替换的 CSS 占位表现，不是官方素材。

