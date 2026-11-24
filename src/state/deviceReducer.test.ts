import { describe, expect, it } from "vitest";

import type { MatchedEncounter } from "../contracts";
import { createInitialDeviceState, deviceReducer } from "./deviceReducer";

const peerEncounter: MatchedEncounter = {
  status: "matched",
  encounter_id: "enc_peer_001",
  match_mode: "contextual",
  content_type: "peer_post",
  source: "encounter_pool",
  content_id: "post_02f4",
  title: "一封匿名心事",
  summary: "有人最近也在为求职感到焦虑。",
  match_reason: "和刚才的对话有关",
  can_support: true,
  support_options: [{ message_id: "msg_cheer", label: "抱抱你" }],
  peer_author: {
    anonymous_author_id: "anon_8f2b",
    display_name: "远方的小看山",
    pet_avatar_id: "liukanshan_04",
  },
  zhihu_content: null,
  created_at: "2026-11-24T08:00:00.000Z",
};

const zhihuEncounter: MatchedEncounter = {
  ...peerEncounter,
  encounter_id: "enc_zhihu_001",
  content_type: "zhihu_article",
  source: "zhihu_search",
  title: "知乎经验卡",
  can_support: false,
  support_options: [],
  peer_author: null,
  zhihu_content: {
    url: "https://www.zhihu.com/question/123456789",
    thumbnail_url: null,
    author_name: "知乎答主",
    author_avatar: null,
    vote_up_count: 10,
    comment_count: 2,
    search_hash_id: "search_demo",
  },
};

describe("deviceReducer", () => {
  it("moves from avatar choice to the home device screen", () => {
    const state = deviceReducer(createInitialDeviceState(), {
      type: "avatar_confirmed",
      petAvatarId: "liukanshan_03",
    });

    expect(state.screen).toBe("home");
    expect(state.petAvatarId).toBe("liukanshan_03");
  });

  it("locks repeated shakes while an encounter is matching", () => {
    const matching = deviceReducer(createInitialDeviceState("liukanshan_01"), {
      type: "shake_started",
    });
    const repeated = deviceReducer(matching, { type: "shake_started" });

    expect(matching.screen).toBe("matching");
    expect(repeated).toEqual(matching);
  });

  it("shows supportable peer content as an encounter", () => {
    const state = deviceReducer(createInitialDeviceState("liukanshan_01"), {
      type: "encounter_received",
      encounter: peerEncounter,
    });

    expect(state.screen).toBe("encounter");
    expect(state.encounter?.can_support).toBe(true);
  });

  it("shows a Zhihu encounter without creating support options", () => {
    const state = deviceReducer(createInitialDeviceState("liukanshan_01"), {
      type: "encounter_received",
      encounter: zhihuEncounter,
    });

    expect(state.screen).toBe("encounter");
    expect(state.encounter?.can_support).toBe(false);
    expect(state.encounter?.support_options).toEqual([]);
  });

  it("confirms a sent support without incorrectly showing the sender a new letter", () => {
    const encounterState = deviceReducer(createInitialDeviceState("liukanshan_01"), {
      type: "encounter_received",
      encounter: peerEncounter,
    });
    const sentState = deviceReducer(encounterState, { type: "support_delivered" });

    expect(sentState.screen).toBe("support_sent");
    expect(sentState.unreadLetters).toBe(0);
  });
});
