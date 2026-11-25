# 掌心萌宠｜摇一摇模块前后端联调契约（V0.1）

> 给：后端与硬件同学  
> 范围：登录后六套形象选择、摇一摇情绪/知识奇遇、陌生人助力与来信。  
> 状态：**前端 Mock 联调契约**；未接真实服务前，前端使用同名 Mock 数据。  
> 命名：HTTP JSON 使用 `snake_case`；时间使用 ISO 8601 UTC；所有 ID 为不透明字符串。

## 1. 先说清楚边界

- 用户摇动设备的识别由 **ESP32 本地 IMU（加速度计）**完成；识别成功后才调用后端。压力值不参与本模块。
- 后端只负责：根据当前 Session / 已授权记忆确定匹配类型、从产品匿名池或知乎官方内容中选一条内容、保存助力和生成来信。
- 六个形象是产品自有的固定匿名形象，不是知乎头像，也不从知乎接口读取。用户之间绝不互传真实 `user_id`、知乎账号 ID、手机号或原始对话。
- 知乎密钥只存在服务端环境变量。设备、浏览器前端和 ESP32 不得直接调用知乎 API。
- 本文中的“陌生人帖子”指产品自有、经用户同意后进入奇遇池的匿名内容；不是把用户私密对话或知乎评论公开。

## 2. 统一枚举与对象

```ts
type PetAvatarId =
  | "liukanshan_01"
  | "liukanshan_02"
  | "liukanshan_03"
  | "liukanshan_04"
  | "liukanshan_05"
  | "liukanshan_06";

// 摇一摇时后端采用哪一种上下文；不是内容类型。
type MatchMode = "contextual" | "random";

// 统一内容类型；客户端据此决定卡片布局和可用操作。
type ContentType =
  | "peer_post"
  | "zhihu_question"
  | "zhihu_answer"
  | "zhihu_article";

// 内容来自哪里；source=demo 时必须在前端明确显示“演示内容”。
type ContentSource = "encounter_pool" | "zhihu_search" | "zhihu_hot" | "demo";

type EncounterStatus = "matched" | "empty";
type MessageType = "support_received" | "system";

interface PublicPetProfile {
  anonymous_author_id: string; // 仅匿名池内部 ID，不能反推真实用户
  display_name: string;        // 例如“远方的小看山”，不能包含真实昵称
  pet_avatar_id: PetAvatarId;
}

interface ZhihuContentMeta {
  url: string;
  thumbnail_url: string | null;
  author_name: string | null;
  author_avatar: string | null;
  vote_up_count: number | null;
  comment_count: number | null;
  search_hash_id: string | null;
}
```

## 3. 首次登录后的六套形象选择

### 3.1 登录 / 设备绑定

沿用设备登录接口，在成功响应中增加是否需要选择形象。

`POST /devices/bind`

```json
{
  "device_id": "esp32s3-demo-001",
  "activation_code": "ABCD-1234"
}
```

```json
{
  "data": {
    "user_id": "usr_xxx",
    "device_id": "esp32s3-demo-001",
    "access_token": "<only-returned-over-https>",
    "memory_consent": false,
    "onboarding_required": true,
    "profile": {
      "pet_avatar_id": null
    }
  }
}
```

规则：`onboarding_required=true` 或 `profile.pet_avatar_id=null` 时，前端进入“左右滑动选择六个形象”页；选定后才能进入首页。

### 3.2 保存形象选择

`PATCH /me/profile`

请求：

```json
{
  "pet_avatar_id": "liukanshan_03"
}
```

响应：

```json
{
  "data": {
    "pet_avatar_id": "liukanshan_03",
    "updated_at": "2026-11-23T10:00:00Z"
  }
}
```

后端校验值必须只允许 `liukanshan_01` 至 `liukanshan_06`。前端先在本地以同一只临时刘看山插画配合不同色环、背景或编号模拟六种形象；正式六套 PNG / sprite 到位后，只替换 `pet_avatar_id → 本地资源` 的映射，不改 API。

## 4. 触发与状态规则

1. ESP32 / 浏览器 Mock 检测到摇一摇，先生成 UUID `request_id`，本地进入“正在遇见”状态。
2. 若有仍在有效期内的 `session_id`（建议：最后一次对话结束后 3 分钟内），一起提交；无则传 `null`。
3. 后端用 `request_id` 做幂等：相同用户的重复请求返回第一次结果，避免网络重试出现多张卡片。
4. 后端判断：有有效 Session 则优先 `contextual`；否则 `random`。前端只展示后端返回的 `match_mode`，不自行决定。
5. 后端先决定情绪池还是知乎内容，再统一为下方 `Encounter`。无合适结果返回 `status=empty`，前端展示温柔空态，不能编造知乎内容。

## 5. 摇一摇匹配

`POST /encounters/shake`

认证：应用自己的 `Authorization: Bearer <access_token>`。用户和设备身份由 token 推导，**不接收或信任前端传来的 `user_id`**。

请求：

```json
{
  "request_id": "0f727de6-3acb-4d59-8be7-2e1c48ac2e30",
  "session_id": "ses_abc123",
  "trigger_source": "imu",
  "client_triggered_at": "2026-11-23T10:03:12Z"
}
```

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `request_id` | 是 | 前端生成 UUID；重试复用同一个值。 |
| `session_id` | 否 | 最近一次对话 Session；无会话传 `null`。服务端要校验归属和有效期。 |
| `trigger_source` | 是 | `imu`（真实硬件）或 `mock`（电脑预览）。仅作日志/调试，不改变匹配权限。 |
| `client_triggered_at` | 是 | 客户端触发时间；服务端仍以自身时间判定有效期。 |

成功且有内容：

```json
{
  "data": {
    "status": "matched",
    "encounter_id": "enc_9c91",
    "match_mode": "contextual",
    "content_type": "peer_post",
    "source": "encounter_pool",
    "content_id": "post_02f4",
    "title": "找工作时总觉得自己不够好，怎么办？",
    "summary": "最近投了几次简历，越准备越焦虑……",
    "match_reason": "和你刚才聊到的求职压力有关",
    "can_support": true,
    "support_options": [
      { "message_id": "msg_cheer", "label": "抱抱你" },
      { "message_id": "msg_strength", "label": "你已经很努力了" }
    ],
    "peer_author": {
      "anonymous_author_id": "anon_8f2b",
      "display_name": "远方的小看山",
      "pet_avatar_id": "liukanshan_04"
    },
    "zhihu_content": null,
    "created_at": "2026-11-23T10:03:13Z"
  }
}
```

无可展示内容：

```json
{
  "data": {
    "status": "empty",
    "encounter_id": null,
    "empty_reason": "no_eligible_content",
    "retry_after_seconds": 30
  }
}
```

### 5.1 内容分支约定

| 情况 | `content_type` / `source` | `peer_author` | `zhihu_content` | `can_support` |
| --- | --- | --- | --- | --- |
| 产品匿名池的情绪内容 | `peer_post` / `encounter_pool` | 必填 | `null` | `true` |
| 知乎搜索结果 | `zhihu_question`、`zhihu_answer` 或 `zhihu_article` / `zhihu_search` | `null` | 必填 | `false` |
| 知乎热榜回退 | `zhihu_question` 或 `zhihu_article` / `zhihu_hot` | `null` | 必填 | `false` |
| 未接真实服务的演示 | 对应内容类型 / `demo` | 按内容决定 | 按内容决定 | 仅 Mock 环境可为 `true` |

知乎内容示例：

```json
{
  "data": {
    "status": "matched",
    "encounter_id": "enc_a31e",
    "match_mode": "random",
    "content_type": "zhihu_article",
    "source": "zhihu_search",
    "content_id": "123456789",
    "title": "求职低谷期，如何恢复节奏？",
    "summary": "一位答主分享了自己调整求职心态的方法……",
    "match_reason": "为你找到一条知乎经验",
    "can_support": false,
    "support_options": [],
    "peer_author": null,
    "zhihu_content": {
      "url": "https://www.zhihu.com/question/123456789",
      "thumbnail_url": null,
      "author_name": "知乎答主",
      "author_avatar": "https://...",
      "vote_up_count": 128,
      "comment_count": 15,
      "search_hash_id": "search_hash_xxx"
    },
    "created_at": "2026-11-23T10:03:13Z"
  }
}
```

## 6. 奇遇详情与陌生人助力

### 6.1 获取详情（进入详情页或网络重连时）

`GET /encounters/{encounter_id}`

响应字段与 `POST /encounters/shake` 的 `data` 相同；服务端应检查该 `encounter_id` 属于当前用户且未过期/未下架。前端先使用摇一摇响应绘制首屏，详情请求不应阻塞动画。

### 6.2 发送鼓励 / 留言

`POST /encounters/{encounter_id}/support`

仅当 `can_support=true` 时显示此操作。`message_id` 仅能取该奇遇返回的 `support_options[].message_id`；后续如开放短留言，再增加可选 `custom_message`，并在服务端审核后投递。

```json
{
  "message_id": "msg_cheer",
  "client_request_id": "621c1a92-65c6-4a54-b9da-e8055b2b66c3"
}
```

```json
{
  "data": {
    "support_id": "sup_b7f2",
    "success": true,
    "delivery_status": "queued",
    "created_at": "2026-11-23T10:05:01Z"
  }
}
```

规则：

- `client_request_id` 同样幂等；用户双击或重试只能产生一条助力。
- 后端创建助力后，异步写入原作者的来信；因审核、撤回或内容下架无法投递时，用 `delivery_status=not_delivered` 返回，前端显示“这份心意暂时没能送达”。
- 不允许助力者与原作者建立聊天、关注或任何可识别身份关系。

## 7. 原作者的来信

### 7.1 来信列表

`GET /messages?unread_only=false&limit=20`

```json
{
  "data": {
    "unread_count": 1,
    "items": [
      {
        "message_id": "letter_83bd",
        "type": "support_received",
        "title": "一封来自远方的鼓励",
        "content": "对方想对你说：抱抱你",
        "related_encounter_id": "enc_9c91",
        "sender": {
          "anonymous_sender_id": "anon_sender_d2",
          "display_name": "一只小看山",
          "pet_avatar_id": "liukanshan_02"
        },
        "created_at": "2026-11-23T10:05:02Z",
        "is_read": false
      }
    ]
  }
}
```

`PATCH /messages/{message_id}/read`

```json
{
  "data": {
    "message_id": "letter_83bd",
    "is_read": true,
    "read_at": "2026-11-23T10:06:02Z"
  }
}
```

## 8. 知乎官方能力：后端做什么

后端将产品内部字段统一后再交给前端，前端不需要也不应直接理解知乎鉴权字段。

### 收藏能力边界

项目成员提供的 `GET /api/v1/user/collections`、`GET /api/v1/user/favlists` 和 `GET /api/v1/user/favlist_contents` 只能读取公开范围内的收藏数据；读取其他用户数据需其知乎 OAuth 授权。它们不能将本次奇遇写进用户的知乎收藏。当前摇一摇前端不展示“同步收藏”按钮，也不向这三个接口直接发请求。若后续需要“稍后看”，由产品后端单独设计自有保存接口；知乎收藏只能在获得明确的官方写入权限后另行设计。

| 后端步骤 | 推荐能力 | 输入 | 输出给本模块 |
| --- | --- | --- |
| 从 Session/Memory 提炼检索短语 | 知乎直答 API（`zhida-fast-1p5`） | 已脱敏的主题/摘要 | `query`、`intent`、`tags`；必须解析、校验、失败回退 |
| 查相关知乎内容 | 知乎搜索 API | `Query`、`Count`、可选 `SortBy` | 规范化为 `ZhihuContentMeta` + `content_type` |
| 无明确主题时发现热点 | 知乎热榜 API | `Limit` | 规范化为 `ZhihuContentMeta`，缺失作者/指标均传 `null` |

### 8.1 直答 API 的正确用法

- 可以通过 `messages` 中的指令让直答模型“只输出一个检索短语、意图和标签”。
- **不能修改**知乎直答 API 的入参协议；它官方保证的请求字段只有 `model`、`messages`、`stream`。
- 直答 API 不保证严格 JSON。后端必须自行解析和白名单校验；解析失败时回退为安全的本地主题词或热榜，不能把未经校验的模型文本直接作为搜索参数。
- 不向知乎模型提交原始音频、姓名、联系方式、真实知乎账号信息或完整私密对话；只提交最少、已脱敏的主题摘要。

### 8.2 官方返回字段映射

| 产品字段 | 知乎搜索 API | 知乎热榜 API |
| --- | --- | --- |
| `content_id` | `Items[].ContentID` | 服务端由 `Url` 生成稳定 ID，或留服务端内部 ID |
| `content_type` | `Items[].ContentType` 映射为 `zhihu_question` / `zhihu_answer` / `zhihu_article` | 根据 URL/返回内容判断 question 或 article |
| `title` | `Items[].Title` | `Items[].Title` |
| `summary` | `Items[].ContentText`（去除高亮 HTML） | `Items[].Summary` |
| `url` | `Items[].Url` | `Items[].Url` |
| `author_name` / `author_avatar` | `Items[].AuthorName` / `AuthorAvatar` | 官方接口未返回，传 `null` |
| `vote_up_count` / `comment_count` | `Items[].VoteUpCount` / `CommentCount` | 官方接口未返回，传 `null` |
| `thumbnail_url` | 当前搜索字段未保证，传 `null` | `Items[].ThumbnailUrl` |
| `search_hash_id` | `Data.SearchHashId` | `null` |

## 9. 统一错误响应与前端降级

```json
{
  "error": {
    "code": "ENCOUNTER_RATE_LIMITED",
    "message": "请稍等一下再摇摇看",
    "retry_after_seconds": 30
  }
}
```

建议错误码：

| HTTP | `error.code` | 前端行为 |
| --- | --- | --- |
| 401 | `UNAUTHORIZED` | 回到绑定/登录页。 |
| 400 | `INVALID_REQUEST` | 结束加载，显示“这次没有成功，稍后再试”。 |
| 404 | `ENCOUNTER_NOT_FOUND` | 返回摇一摇首页，内容可能已撤回。 |
| 409 | `SESSION_EXPIRED` | 自动按无 Session 重试一次，或提示再摇一次。 |
| 429 | `ENCOUNTER_RATE_LIMITED` | 展示倒计时，禁止重复触发。 |
| 503 | `UPSTREAM_UNAVAILABLE` | 若产品允许可给 `source=demo` 的明确演示卡；生产环境不要伪装为真实知乎内容。 |

## 10. 后端交付检查清单

- [ ] `POST /devices/bind` 返回 `onboarding_required` 与 `profile.pet_avatar_id`。
- [ ] `PATCH /me/profile` 校验并保存六个固定 `pet_avatar_id`。
- [ ] `POST /encounters/shake` 实现 `request_id` 幂等、Session 校验、`contextual/random` 决策和 `matched/empty` 两种响应。
- [ ] 所有奇遇统一输出第 5 节字段；不把知乎原始接口直接透传给前端。
- [ ] `GET /encounters/{encounter_id}`、助力、来信列表和已读接口按本文返回。
- [ ] 用户身份只由服务端 token 推导；匿名内容只下发 `PublicPetProfile`。
- [ ] 知乎 API / 直答 API 仅由服务端调用，日志不记录密钥和不必要的私密文本。
- [ ] 知乎接口未获凭证、无结果或限流时，返回明确空态/错误/`demo` 标识，不伪装为实时内容。

## 11. 前端 Mock 检查清单

- [ ] 首次登录模拟 `onboarding_required=true`，左右滑动展示六个 `pet_avatar_id`，保存后进入首页。
- [ ] 摇一摇按钮 / 传感器事件统一进入同一个 `shake()` 状态机，并提交 `trigger_source=mock` 或 `imu`。
- [ ] 至少覆盖：匿名池命中、知乎搜索命中、热榜命中、空态、限流、助力成功、助力无法投递、来信已读。
- [ ] 只根据 `content_type`、`source`、`can_support` 渲染，不根据标题文字猜业务分支。
- [ ] 所有 `pet_avatar_id` 走本地资源映射；未知 ID 显示安全默认形象并上报日志。

