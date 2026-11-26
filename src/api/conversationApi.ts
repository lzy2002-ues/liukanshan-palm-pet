import type {
  ChatMessageRequest,
  ChatMessageResponse,
  SpeechTranscribeRequest,
  SpeechTranscribeResponse,
} from "../contracts";

export interface ConversationApi {
  transcribeSpeech(request: SpeechTranscribeRequest): Promise<SpeechTranscribeResponse>;
  sendChatMessage(request: ChatMessageRequest): Promise<ChatMessageResponse>;
}

const demoTranscript = "最近找工作有点焦虑，投了几次简历都没有回音，明明已经准备了很久，还是担心自己不够好。";

export const mockConversationApi: ConversationApi = {
  async transcribeSpeech() {
    return { data: { text: demoTranscript, duration_ms: 2200 } };
  },
  async sendChatMessage(request) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return {
      data: {
        message_id: `msg_${request.client_message_id}`,
        session_id: request.session_id ?? "ses_job_search",
        reply: request.session_id
          ? "听起来这段时间很不容易。我在这儿，陪你慢慢整理。"
          : "我记住啦，想不想遇见有相似经历的小看山？",
        emotion: "anxious",
        session_summary: "用户正在经历求职焦虑",
        suggest_shake: true,
        zhihu_suggestion: null,
      },
    };
  },
};
