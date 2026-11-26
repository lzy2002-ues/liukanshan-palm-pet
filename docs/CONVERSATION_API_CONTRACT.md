# 对话到摇一摇的前后端联调字段（V0.1）

当前浏览器运行的是 Mock；此文档约定应用自有后端接口，不是知乎官方 API。真实音频由 ESP32 麦克风录制，识别语音是 **ASR**；OCR 用于识别图片文字，不属于此链路。模型及知乎凭证只放在后端。

## 链路

正式首页的「进入对话」触发 `open_conversation`，进入同一设备框的对话页。按住按钮时显示声波，松开后依次调用转写和对话接口。用户转写最多显示两行，约 4.5 秒后连同气泡消失；后端返回的 `reply` 留在看山气泡，直到下一轮回复替换。对话不会自动摇到别人；只有设备 IMU 判定摇动，或浏览器预览按钮，才请求匹配。

## `POST /speech/transcribe`

`multipart/form-data`，认证为应用的设备/用户访问 token。请求字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `audio_file` | File | 真实硬件上传的音频；浏览器 Mock 只给占位 Blob |
| `session_id` | string，可省略 | 第一轮没有会话 ID 时省略；后续使用上轮后端值 |

响应：`{ "data": { "text": "识别出的用户说话", "duration_ms": 2200 } }`。`text` 是 ASR 结果，不由前端编造。若无有效语音，后端应返回明确错误；前端提示重说。

## `POST /chat/messages`

`application/json`。请求：

```json
{ "client_message_id": "uuid", "session_id": null, "text": "识别出的用户说话" }
```

首轮 `session_id=null`，后端创建会话；后续带回上轮响应的 `session_id`。`client_message_id` 供后端幂等。响应：

```json
{
  "data": {
    "message_id": "msg_001",
    "session_id": "ses_001",
    "reply": "我在这儿，陪你慢慢整理。",
    "emotion": "anxious",
    "session_summary": "用户正在经历求职焦虑",
    "suggest_shake": true,
    "zhihu_suggestion": null
  }
}
```

设备当前只展示 `reply`；`emotion`、`session_summary`、`suggest_shake` 和 `zhihu_suggestion` 预留给后续角色状态和引导，不能拿模型原始输出直接作为设备契约。后端负责模型调用与字段校验。前端保留 `session_id`，摇动时传入 `POST /encounters/shake`；后端决定是否使用上下文，以及匹配产品匿名池或知乎官方内容。

## 实现替换点

- [`src/api/conversationApi.ts`](../src/api/conversationApi.ts)：浏览器 Mock；`ConversationApi` 接口保持一致。
- [`src/hardware/voiceCapture.ts`](../src/hardware/voiceCapture.ts)：浏览器假录音；硬件接入时替换为实际录音/上传桥接。
- [`src/api/httpAdapters.ts`](../src/api/httpAdapters.ts)：已写好的 HTTP 请求映射。完成登录、后端和设备网络后注入 `App`，当前不自动启用。
- [`src/contracts.ts`](../src/contracts.ts)：统一 TypeScript 请求/响应字段；HTTP JSON 为 `snake_case`。

真实用户 `user_id` 只在服务端用于识别帖子的主人与投递来信。陌生人的设备只接收 `peer_author.anonymous_author_id`、`display_name`、`pet_avatar_id`；页面展示匿名昵称和形象，不暴露真实账号 ID。帖子详情字段见 [`SHAKE_MODULE_API_CONTRACT.md`](SHAKE_MODULE_API_CONTRACT.md)。
