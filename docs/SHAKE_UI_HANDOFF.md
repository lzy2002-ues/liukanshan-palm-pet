# 摇一摇前端交接与首页合并说明

> 交付分支：`codex/shake-ui`。本分支是可在电脑浏览器运行的 React Mock，供首页同学合并交互、后端同学对齐字段；它不是 ESP32 固件。

## 给队友的最短读取路径

1. 先读根目录 [`AGENTS.md`](../AGENTS.md) 和 [`docs/PRD-V1.0.md`](PRD-V1.0.md)，确认当前掌机产品边界。
2. 读 [`docs/SHAKE_MODULE_API_CONTRACT.md`](SHAKE_MODULE_API_CONTRACT.md) 与 [`src/contracts.ts`](../src/contracts.ts)，以这里的 `snake_case` 请求/响应字段为联调基准。
3. 运行下方命令，在浏览器中体验首页 → 对话 → 摇一摇相遇 → 情绪奇遇 → 助力送出。
4. 按本页“与首页同学合并”一节接入，避免直接覆盖另一位同学的首页页面。

```bash
git fetch origin
git switch codex/shake-ui
npm ci
npm run dev
```

Vite 会打印本地预览地址，通常为 `http://localhost:5173/`。检查改动可运行 `npm test -- --run` 和 `npm run build`。

## 模块文件与所有权

| 文件 | 用途 |
| --- | --- |
| [`src/App.tsx`](../src/App.tsx) | 串起首登选形象、临时首页、对话、摇动、相遇、奇遇、助力、来信的演示入口。这里包含临时首页布局，合并时由首页负责人决定最终首页容器。 |
| [`src/state/deviceReducer.ts`](../src/state/deviceReducer.ts) | 页面状态与事件：`open_conversation`、`talk_started`、`conversation_updated`、`shake_started`、`encounter_received`、`support_delivered`、`go_home`。 |
| [`src/api/encounterApi.ts`](../src/api/encounterApi.ts) | 当前 Mock 数据与两个异步接口适配点：`requestEncounter`、`sendSupport`。未来由真实业务后端实现。 |
| [`src/contracts.ts`](../src/contracts.ts) | 摇动、匹配、匿名形象、助力的 TypeScript 统一类型。 |
| [`src/components/AvatarCarousel.tsx`](../src/components/AvatarCarousel.tsx) | 首登六套形象与 `avatarImageById` 本地资源映射；正式六图到位后只需替换映射。 |
| [`src/components/EncounterCard.tsx`](../src/components/EncounterCard.tsx) | 情绪/知识奇遇卡与按住助力操作。 |
| [`src/styles.css`](../src/styles.css) | 432×432 外框、384×317 雪丘内框及对话/奇遇样式。合并时核对同名 CSS 类，避免覆盖首页同学的样式。 |

## 与首页同学合并

- **共同入口**：首页的「进入对话」触发 `open_conversation`；进入同一 432×432 设备框的对话状态。对话页底部按钮是「按住说话」，上方在无转写时不渲染气泡；松开后显示本轮转写约 4.5 秒，刘看山回复持续到下一轮替换。不要把示例首页整体覆盖到正式首页上。
- **摇动事件**：实机由 IMU 在本地达到阈值后调用 `shake()` 所对应的事件入口。电脑浏览器的「模拟摇动设备」按钮只用于预览，不应出现在正式设备屏幕内。当前 Mock 发送 `trigger_source: "mock"`；ESP32 应发送 `"imu"`。
- **页面切换**：摇动后进入 `matching`；约 1.8 秒后，若命中产品匿名池，进入 `peer_reveal`，只显示对方形象与“匹配到×××”约 1.6 秒，随后进入 `encounter` 白框帖子页。无匹配进入 `empty`，知识奇遇直接进入 `encounter`。右上角关闭回首页。情绪奇遇白框显示匿名昵称、标题、摘要，底部助力按钮与对话页「按住说话」同宽高，点赞图标和进度随按住操作从左向右推进；知识奇遇仅提供知乎原文入口。
- **不要覆盖的部分**：另一位同学的正式首页视觉、来信入口和共享设备外框应作为集成基线。合并时抽取本分支对话与奇遇状态、组件和必要 CSS，并统一两边的状态管理入口。
- **资源**：当前六个 `pet_avatar_id` 暂共用一张透明处理图，以 CSS 配色区分；队友交付六套正式图后替换映射。背景 SVG 与处理图清单见 [`docs/asset-inventory.md`](asset-inventory.md)。

## 给后端与硬件同学的接口边界

- 摇动请求：`POST /encounters/shake`，核心字段是 `request_id`、`session_id`、`trigger_source`、`client_triggered_at`。`request_id` 用于幂等；当前浏览器构造 Mock ID。
- 助力请求：`POST /encounters/{encounter_id}/support`，发送 `message_id`、`client_request_id`。后端返回 `support_id`、`success`、`delivery_status`、`created_at`；`queued` 表示投递排队中，不代表对方已经看到。
- 对方形象与昵称：响应中提供 `peer_author.anonymous_author_id`（内部匿名 ID）、`display_name`（界面显示名）、`pet_avatar_id`（六图之一）。设备只渲染后两项，不显示真实账号 ID。
- 知乎搜索/热榜/直答由服务端调用，设备或浏览器不放 Access Secret。`peer_post` 来自产品自有匿名池，不应伪装成知乎帖子，也不保证有知乎链接。
- 完整字段、空态与错误处理以 [`docs/SHAKE_MODULE_API_CONTRACT.md`](SHAKE_MODULE_API_CONTRACT.md) 为准；真实 ASR/LLM、ESP32 固件和后端持久化仍未接入。

## 可直接发给队友的 Codex 指令

> 请从团队仓库的 `codex/shake-ui` 分支读取摇一摇前端。先读 `AGENTS.md`、`docs/PRD-V1.0.md`、`docs/SHAKE_UI_HANDOFF.md` 和 `docs/SHAKE_MODULE_API_CONTRACT.md`，再运行 `npm ci`、`npm run dev` 看完整 Mock。合并首页时保留你负责的正式首页与设备外框，接入这个分支的 `conversation`、`matching`、`encounter`、`empty`、`support_sent` 状态和对应组件；注意 `src/App.tsx` 中的首页只是演示版，不要直接覆盖。联调类型以 `src/contracts.ts` 为准，当前接口实现是 `src/api/encounterApi.ts` 的 Mock。请在独立分支合并并运行 `npm test -- --run` 与 `npm run build`，遇到冲突时保留两边功能并记录决策。
