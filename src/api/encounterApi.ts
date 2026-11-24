import type {
  Encounter,
  ShakeRequest,
  ShakeResponse,
  SupportRequest,
  SupportResponse,
} from "../contracts";

const encounterRequests = new Map<string, ShakeResponse>();
const supportRequests = new Map<string, SupportResponse>();
const createdAt = "2026-11-24T08:00:01.000Z";

const peerEncounter: Encounter = {
  status: "matched",
  encounter_id: "enc_peer_001",
  match_mode: "contextual",
  content_type: "peer_post",
  source: "encounter_pool",
  content_id: "post_02f4",
  title: "找工作时总觉得自己不够好，怎么办？",
  summary: "最近投了几次简历，越准备越焦虑。有人也正在慢慢找回自己的节奏。",
  match_reason: "和你刚才聊到的求职压力有关",
  can_support: true,
  support_options: [
    { message_id: "msg_cheer", label: "抱抱你" },
    { message_id: "msg_strength", label: "你已经很努力了" },
  ],
  peer_author: {
    anonymous_author_id: "anon_8f2b",
    display_name: "远方的小看山",
    pet_avatar_id: "liukanshan_04",
  },
  zhihu_content: null,
  created_at: createdAt,
};

const zhihuEncounter: Encounter = {
  status: "matched",
  encounter_id: "enc_zhihu_001",
  match_mode: "contextual",
  content_type: "zhihu_article",
  source: "demo",
  content_id: "123456789",
  title: "求职低谷期，如何恢复节奏？",
  summary: "一位答主分享了自己调整求职心态的方法，或许能给你一点新的视角。",
  match_reason: "我帮你找到一条知乎经验",
  can_support: false,
  support_options: [],
  peer_author: null,
  zhihu_content: {
    url: "https://www.zhihu.com/question/123456789",
    thumbnail_url: null,
    author_name: "知乎答主",
    author_avatar: null,
    vote_up_count: 128,
    comment_count: 15,
    search_hash_id: null,
  },
  created_at: createdAt,
};

const emptyEncounter: Encounter = {
  status: "empty",
  encounter_id: null,
  empty_reason: "no_eligible_content",
  retry_after_seconds: 30,
};

function cloneEncounter(encounter: Encounter): Encounter {
  return JSON.parse(JSON.stringify(encounter)) as Encounter;
}

function selectEncounter(sessionId: string | null): Encounter {
  if (sessionId === "ses_zhihu_help") return cloneEncounter(zhihuEncounter);
  if (sessionId === "ses_empty") return cloneEncounter(emptyEncounter);
  return cloneEncounter(peerEncounter);
}

export async function requestEncounter(request: ShakeRequest): Promise<ShakeResponse> {
  const existing = encounterRequests.get(request.request_id);
  if (existing) return existing;

  const response = { data: selectEncounter(request.session_id) };
  encounterRequests.set(request.request_id, response);
  return response;
}

export async function sendSupport(
  encounterId: string,
  request: SupportRequest,
): Promise<SupportResponse> {
  const existing = supportRequests.get(request.client_request_id);
  if (existing) return existing;

  if (encounterId !== "enc_peer_001" || !["msg_cheer", "msg_strength"].includes(request.message_id)) {
    throw new Error("Support option is not available for this encounter");
  }

  const response: SupportResponse = {
    data: {
      support_id: `sup_${request.client_request_id}`,
      success: true,
      delivery_status: "queued",
      created_at: "2026-11-24T08:01:00.000Z",
    },
  };
  supportRequests.set(request.client_request_id, response);
  return response;
}
