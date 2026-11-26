import { describe, expect, it, vi } from "vitest";
import { createHttpConversationApi, createHttpEncounterApi } from "./httpAdapters";

describe("backend HTTP adapter", () => {
  it("sends audio as multipart, chat as JSON and carries the backend session into shake", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });
    const connection = { baseUrl: "https://backend.example/", getAccessToken: () => "device-token", fetcher: fetcher as typeof fetch };
    const conversation = createHttpConversationApi(connection);
    const encounter = createHttpEncounterApi(connection);
    await conversation.transcribeSpeech({ audio_file: new Blob(["audio"]), session_id: null });
    await conversation.sendChatMessage({ client_message_id: "msg-1", session_id: "ses-1", text: "你好" });
    await encounter.requestEncounter({ request_id: "shake-1", session_id: "ses-1", trigger_source: "imu", client_triggered_at: "2026-11-26T00:00:00Z" });
    expect(fetcher).toHaveBeenNthCalledWith(1, "https://backend.example/speech/transcribe", expect.objectContaining({ method: "POST", body: expect.any(FormData) }));
    const audioOptions = fetcher.mock.calls[0][1] as RequestInit;
    expect((audioOptions.body as FormData).get("audio_file")).toBeInstanceOf(Blob);
    expect((audioOptions.body as FormData).has("session_id")).toBe(false);
    expect(audioOptions.headers).not.toHaveProperty("Content-Type");
    expect(fetcher).toHaveBeenNthCalledWith(2, "https://backend.example/chat/messages", expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toMatchObject({ session_id: "ses-1", text: "你好" });
    expect(JSON.parse(fetcher.mock.calls[2][1].body)).toMatchObject({ session_id: "ses-1", trigger_source: "imu" });
    expect(fetcher.mock.calls[2][1].headers.Authorization).toBe("Bearer device-token");
  });
});
