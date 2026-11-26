import type { ConversationApi } from "./conversationApi";
import type { EncounterApi } from "./encounterApi";
import type { ChatMessageResponse, ShakeResponse, SpeechTranscribeResponse, SupportResponse } from "../contracts";

export interface BackendConnection {
  baseUrl: string;
  getAccessToken: () => string | null;
  fetcher?: typeof fetch;
}

function client(connection: BackendConnection) {
  const fetcher = connection.fetcher ?? fetch;
  return async <T>(path: string, init: RequestInit): Promise<T> => {
    const token = connection.getAccessToken();
    if (!token) throw new Error("Device access token is missing");
    const response = await fetcher(`${connection.baseUrl.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...init.headers },
    });
    if (!response.ok) throw new Error(`Backend request failed: ${response.status}`);
    return response.json() as Promise<T>;
  };
}

// Inject these in App only after the team backend and device login are ready.
export function createHttpConversationApi(connection: BackendConnection): ConversationApi {
  const request = client(connection);
  return {
    transcribeSpeech({ audio_file, session_id }) {
      const body = new FormData();
      body.append("audio_file", audio_file, "speech.wav");
      if (session_id) body.append("session_id", session_id);
      return request<SpeechTranscribeResponse>("/speech/transcribe", { method: "POST", body });
    },
    sendChatMessage(body) {
      return request<ChatMessageResponse>("/chat/messages", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
    },
  };
}

export function createHttpEncounterApi(connection: BackendConnection): EncounterApi {
  const request = client(connection);
  return {
    requestEncounter(body) {
      return request<ShakeResponse>("/encounters/shake", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
    },
    sendSupport(encounterId, body) {
      return request<SupportResponse>(`/encounters/${encodeURIComponent(encounterId)}/support`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
    },
  };
}
