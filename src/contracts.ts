export type PetAvatarId =
  | "liukanshan_01"
  | "liukanshan_02"
  | "liukanshan_03"
  | "liukanshan_04"
  | "liukanshan_05"
  | "liukanshan_06";

export type MatchMode = "contextual" | "random";
export type ContentType =
  | "peer_post"
  | "zhihu_question"
  | "zhihu_answer"
  | "zhihu_article";
export type ContentSource = "encounter_pool" | "zhihu_search" | "zhihu_hot" | "demo";

export interface ShakeRequest {
  request_id: string;
  session_id: string | null;
  trigger_source: "imu" | "mock";
  client_triggered_at: string;
}

export interface SupportRequest {
  message_id: string;
  client_request_id: string;
}

export interface PublicPetProfile {
  anonymous_author_id: string;
  display_name: string;
  pet_avatar_id: PetAvatarId;
}

export interface ZhihuContentMeta {
  url: string;
  thumbnail_url: string | null;
  author_name: string | null;
  author_avatar: string | null;
  vote_up_count: number | null;
  comment_count: number | null;
  search_hash_id: string | null;
}

export interface SupportOption {
  message_id: string;
  label: string;
}

export interface MatchedEncounter {
  status: "matched";
  encounter_id: string;
  match_mode: MatchMode;
  content_type: ContentType;
  source: ContentSource;
  content_id: string;
  title: string;
  summary: string;
  match_reason: string;
  can_support: boolean;
  support_options: SupportOption[];
  peer_author: PublicPetProfile | null;
  zhihu_content: ZhihuContentMeta | null;
  created_at: string;
}

export interface EmptyEncounter {
  status: "empty";
  encounter_id: null;
  empty_reason: "no_eligible_content";
  retry_after_seconds: number;
}

export type Encounter = MatchedEncounter | EmptyEncounter;

export interface ShakeResponse {
  data: Encounter;
}

export interface SupportResponse {
  data: {
    support_id: string;
    success: boolean;
    delivery_status: "queued" | "not_delivered";
    created_at: string;
  };
}
