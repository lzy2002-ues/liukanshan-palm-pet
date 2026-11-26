import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import App from "./App";
import type { ConversationApi } from "./api/conversationApi";
import type { EncounterApi } from "./api/encounterApi";
import type { VoiceCapture } from "./hardware/voiceCapture";
import type { MatchedEncounter } from "./contracts";

describe("摇一摇掌机 Mock", () => {
  it("lets a first-time user choose an avatar and enter the device home", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "选中 北极蓝" }));
    await user.click(screen.getByRole("button", { name: "我选好了" }));

    expect(screen.getByText("我在这儿。想说什么，慢慢告诉我。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "进入对话" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "按住说话" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "摇一摇遇见" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "模拟摇动设备" })).toBeInTheDocument();
  });

  it("opens conversation and keeps one clipped user preview above the reply", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "选中 北极蓝" }));
    await user.click(screen.getByRole("button", { name: "我选好了" }));
    await user.click(screen.getByRole("button", { name: "进入对话" }));
    expect(screen.queryByLabelText("本轮说话预览")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "返回首页" })).not.toBeInTheDocument();
    fireEvent.pointerDown(screen.getByRole("button", { name: "按住说话" }));
    expect(screen.getByText("正在听你说…")).toBeInTheDocument();
    fireEvent.pointerUp(screen.getByRole("button", { name: "松开，发送" }));

    const preview = await screen.findByLabelText("本轮说话预览");
    expect(preview).toHaveClass("user-preview");
    expect(preview).toHaveTextContent("最近找工作有点焦虑，投了几次简历都没有回音");
    await waitFor(() => expect(screen.getByText("我记住啦，想不想遇见有相似经历的小看山？")).toBeInTheDocument());
    await waitFor(() => expect(screen.queryByLabelText("本轮说话预览")).not.toBeInTheDocument(), { timeout: 6000 });
    expect(screen.getByText("我记住啦，想不想遇见有相似经历的小看山？")).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByRole("button", { name: "按住说话" }));
    fireEvent.pointerUp(screen.getByRole("button", { name: "松开，发送" }));
    await waitFor(() => expect(screen.getByText("听起来这段时间很不容易。我在这儿，陪你慢慢整理。")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "按住说话" })).toBeInTheDocument();
  }, 10000);

  it("confirms sent support without showing the sender a received letter", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "选中 北极蓝" }));
    await user.click(screen.getByRole("button", { name: "我选好了" }));
    await user.click(screen.getByRole("button", { name: "模拟摇动设备" }));

    expect(screen.getByLabelText("两只看山正在相遇")).toBeInTheDocument();
    expect(screen.queryByText("远方的小看山")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("匹配到小野看山")).toBeInTheDocument(), { timeout: 3500 });
    expect(screen.queryByText("找工作时总觉得自己不够好，怎么办？")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("找工作时总觉得自己不够好，怎么办？")).toBeInTheDocument(), { timeout: 4000 });
    expect(screen.getByText("小野看山的分享")).toBeInTheDocument();
    expect(screen.queryByLabelText("对方形象")).not.toBeInTheDocument();
    expect(screen.getByLabelText("点赞助力")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /展开|收起/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /知乎/ })).not.toBeInTheDocument();
    expect(screen.queryByText("anon_8f2b")).not.toBeInTheDocument();
    const supportButton = screen.getByRole("button", { name: "按住助力" });
    fireEvent.pointerDown(supportButton);
    await new Promise((resolve) => setTimeout(resolve, 750));
    fireEvent.pointerUp(supportButton);

    await waitFor(() => expect(screen.getByText("你的助力已送出" )).toBeInTheDocument());
    expect(screen.queryByText("一份小小的心意，正在送往对方的来信。")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "关闭，返回首页" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "回到首页" })).not.toBeInTheDocument();
    expect(screen.queryByText("一封新的来信")).not.toBeInTheDocument();
  }, 12000);

  it("uses backend speech, chat session and matched author fields without auto matching", async () => {
    const user = userEvent.setup();
    const encounter: MatchedEncounter = {
      status: "matched", encounter_id: "enc_backend", match_mode: "contextual",
      content_type: "peer_post", source: "encounter_pool", content_id: "post_backend",
      title: "后端生成的标题", summary: "后端生成的概要", detail_text: "后端生成的详细信息",
      match_reason: "相关经历", can_support: true,
      support_options: [{ message_id: "cheer", label: "助力" }],
      peer_author: { anonymous_author_id: "anon_backend", display_name: "另一只看山", pet_avatar_id: "liukanshan_05" },
      zhihu_content: null, created_at: "2026-11-26T00:00:00Z",
    };
    const voiceCapture: VoiceCapture = { start: vi.fn(), stop: vi.fn().mockResolvedValue(new Blob(["audio"])), cancel: vi.fn() };
    const conversationApi: ConversationApi = {
      transcribeSpeech: vi.fn().mockResolvedValue({ data: { text: "硬件录音转出的文字", duration_ms: 1200 } }),
      sendChatMessage: vi.fn().mockResolvedValue({ data: {
        message_id: "msg_backend", session_id: "ses_backend", reply: "后端模型的回复",
        emotion: "calm", session_summary: "相关经历", suggest_shake: false, zhihu_suggestion: null,
      } }),
    };
    const encounterApi: EncounterApi = {
      requestEncounter: vi.fn().mockResolvedValue({ data: encounter }),
      sendSupport: vi.fn(),
    };
    render(<App voiceCapture={voiceCapture} conversationApi={conversationApi} encounterApi={encounterApi} />);
    await user.click(screen.getByRole("button", { name: "我选好了" }));
    await user.click(screen.getByRole("button", { name: "进入对话" }));
    fireEvent.pointerDown(screen.getByRole("button", { name: "按住说话" }));
    fireEvent.pointerUp(screen.getByRole("button", { name: "松开，发送" }));
    await screen.findByText("后端模型的回复");
    expect(conversationApi.transcribeSpeech).toHaveBeenCalledWith(expect.objectContaining({ session_id: null, audio_file: expect.any(Blob) }));
    expect(conversationApi.sendChatMessage).toHaveBeenCalledWith(expect.objectContaining({ session_id: null, text: "硬件录音转出的文字" }));
    expect(encounterApi.requestEncounter).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "模拟摇动设备" }));
    expect(encounterApi.requestEncounter).toHaveBeenCalledWith(expect.objectContaining({ session_id: "ses_backend", trigger_source: "mock" }));
    await screen.findByText("匹配到另一只看山", {}, { timeout: 3500 });
    await screen.findByText("后端生成的标题", {}, { timeout: 4000 });
    expect(screen.getByText("另一只看山的分享")).toBeInTheDocument();
    expect(screen.getByText("后端生成的概要")).toBeInTheDocument();
    expect(screen.getByText("后端生成的详细信息")).toBeInTheDocument();
    expect(screen.queryByText("anon_backend")).not.toBeInTheDocument();
  }, 9000);
});
