import { describe, expect, it } from "vitest";

import { requestEncounter, sendSupport } from "./encounterApi";

const baseRequest = {
  request_id: "request-peer-001",
  session_id: "ses_job_search",
  trigger_source: "mock" as const,
  client_triggered_at: "2026-11-24T08:00:00.000Z",
};

describe("encounter Mock adapter", () => {
  it("returns a supportable anonymous peer encounter for an active session", async () => {
    const response = await requestEncounter(baseRequest);

    expect(response.data.status).toBe("matched");
    if (response.data.status !== "matched") return;

    expect(response.data.content_type).toBe("peer_post");
    expect(response.data.source).toBe("encounter_pool");
    expect(response.data.can_support).toBe(true);
    expect(response.data.peer_author?.pet_avatar_id).toBe("liukanshan_04");
  });

  it("returns a Zhihu card without support actions for a knowledge request", async () => {
    const response = await requestEncounter({
      ...baseRequest,
      request_id: "request-zhihu-001",
      session_id: "ses_zhihu_help",
    });

    expect(response.data.status).toBe("matched");
    if (response.data.status !== "matched") return;

    expect(response.data.content_type).toBe("zhihu_article");
    expect(response.data.source).toBe("zhihu_search");
    expect(response.data.can_support).toBe(false);
    expect(response.data.support_options).toEqual([]);
    expect(response.data.zhihu_content?.url).toContain("zhihu.com");
  });

  it("returns a soft empty response when the requested Mock scenario has no content", async () => {
    const response = await requestEncounter({
      ...baseRequest,
      request_id: "request-empty-001",
      session_id: "ses_empty",
    });

    expect(response.data).toMatchObject({
      status: "empty",
      empty_reason: "no_eligible_content",
      retry_after_seconds: 30,
    });
  });

  it("does not create duplicate support for one client request", async () => {
    const first = await sendSupport("enc_peer_001", {
      message_id: "msg_cheer",
      client_request_id: "support-once-001",
    });
    const repeated = await sendSupport("enc_peer_001", {
      message_id: "msg_cheer",
      client_request_id: "support-once-001",
    });

    expect(first.data).toEqual(repeated.data);
    expect(first.data.delivery_status).toBe("queued");
  });
});
