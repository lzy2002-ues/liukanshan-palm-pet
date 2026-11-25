import { useEffect, useReducer, useRef, useState } from "react";

import { requestEncounter, sendSupport } from "./api/encounterApi";
import type { PetAvatarId } from "./contracts";
import { AvatarCarousel, avatarOptions, FoxMark } from "./components/AvatarCarousel";
import { DeviceShell } from "./components/DeviceShell";
import { EncounterCard } from "./components/EncounterCard";
import { LetterScreen } from "./components/LetterScreen";
import { createInitialDeviceState, deviceReducer } from "./state/deviceReducer";

const mockTranscript = "最近找工作有点焦虑，投了几次简历都没有回音，明明已经准备了很久，还是担心自己不够好。";
const mockReplies = [
  "我记住啦，想不想遇见有相似经历的小看山？",
  "听起来这段时间很不容易。我在这儿，陪你慢慢整理。",
];

function avatarTone(id: PetAvatarId | null) {
  return avatarOptions.find((option) => option.id === id)?.tone ?? "snow";
}

export default function App() {
  const [state, dispatch] = useReducer(deviceReducer, undefined, () => createInitialDeviceState());
  const [selectedAvatar, setSelectedAvatar] = useState<PetAvatarId>("liukanshan_03");
  const [isListening, setIsListening] = useState(false);
  const [userPreview, setUserPreview] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("我在这儿，慢慢说。");
  const [phoneHint, setPhoneHint] = useState(false);
  const [supportPending, setSupportPending] = useState(false);
  const [supportError, setSupportError] = useState(false);
  const shakeInFlight = useRef(false);
  const supportInFlight = useRef(false);
  const matchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyIndex = useRef(0);
  const voiceRun = useRef(0);

  useEffect(() => () => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    if (previewTimer.current) clearTimeout(previewTimer.current);
    if (matchTimer.current) clearTimeout(matchTimer.current);
    if (revealTimer.current) clearTimeout(revealTimer.current);
  }, []);

  const clearVoice = () => {
    voiceRun.current += 1;
    if (replyTimer.current) clearTimeout(replyTimer.current);
    if (previewTimer.current) clearTimeout(previewTimer.current);
  };

  const startTalking = () => {
    clearVoice();
    setUserPreview(null);
    setIsListening(true);
    dispatch({ type: "talk_started" });
  };

  const finishTalking = () => {
    if (!isListening) return;
    setIsListening(false);
    setUserPreview(mockTranscript);
    dispatch({
      type: "conversation_updated",
      bubbles: [
        { id: "pet-welcome", role: "pet", text: "我在呢，慢慢说也没关系。" },
        { id: "user-job", role: "user", text: mockTranscript },
        { id: "pet-answer", role: "pet", text: "听起来你扛了很多，我陪你慢一点整理。" },
      ],
      showZhihuSuggestion: false,
    });
    const run = ++voiceRun.current;
    previewTimer.current = setTimeout(() => {
      if (run === voiceRun.current) setUserPreview(null);
    }, 4500);
    replyTimer.current = setTimeout(() => {
      if (run !== voiceRun.current) return;
      setReplyText(mockReplies[replyIndex.current % mockReplies.length]);
      replyIndex.current += 1;
    }, 650);
  };

  const shake = async () => {
    if (shakeInFlight.current || state.screen === "matching") return;
    shakeInFlight.current = true;
    clearVoice();
    const sessionId = state.conversation.length > 1 ? "ses_job_search" : null;
    dispatch({ type: "shake_started" });
    try {
      const response = await requestEncounter({
        request_id: `mock-${crypto.randomUUID()}`,
        session_id: sessionId,
        trigger_source: "mock",
        client_triggered_at: new Date().toISOString(),
      });
      matchTimer.current = setTimeout(() => {
        dispatch({ type: "encounter_received", encounter: response.data });
        if (response.data.status === "matched" && response.data.content_type === "peer_post") {
          revealTimer.current = setTimeout(() => dispatch({ type: "reveal_finished" }), 1600);
        }
      }, 1800);
    } catch {
      matchTimer.current = setTimeout(() => dispatch({
        type: "encounter_received",
        encounter: { status: "empty", encounter_id: null, empty_reason: "no_eligible_content", retry_after_seconds: 30 },
      }), 1800);
    } finally {
      shakeInFlight.current = false;
    }
  };

  const support = async (messageId: string) => {
    if (!state.encounter || supportInFlight.current) return;
    supportInFlight.current = true;
    setSupportPending(true);
    setSupportError(false);
    try {
      const response = await sendSupport(state.encounter.encounter_id, {
        message_id: messageId,
        client_request_id: `support-${crypto.randomUUID()}`,
      });
      if (response.data.delivery_status === "not_delivered") setSupportError(true);
      else dispatch({ type: "support_delivered" });
    } catch {
      setSupportError(true);
    } finally {
      supportInFlight.current = false;
      setSupportPending(false);
    }
  };

  return (
    <DeviceShell label="刘看山掌机交互演示" onSimulateShake={shake} showSimulator={state.screen === "home" || state.screen === "conversation"}>
      {state.screen === "avatar_picker" && (
        <section className="onboarding-screen">
          <span className="step-label">第一次见面</span>
          <h1>挑一只陪你的小看山</h1>
          <p>不同配色仅用于匿名奇遇识别，正式形象素材可随时替换。</p>
          <AvatarCarousel selected={selectedAvatar} onSelect={setSelectedAvatar} />
          <button
            className="primary-action"
            onClick={() => dispatch({ type: "avatar_confirmed", petAvatarId: selectedAvatar })}
            type="button"
          >
            我选好了
          </button>
        </section>
      )}

      {state.screen === "home" && (
        <section className="home-screen">
          <div className="home-snow">
            <div className="home-pet"><FoxMark tone={avatarTone(state.petAvatarId)} avatarId={state.petAvatarId} size="large" /></div>
            <div className="home-greeting"><strong>刘看山</strong><span>我在这儿。想说什么，慢慢告诉我。</span></div>
          </div>
          <div className="home-actions">
            <button className="primary-action" onClick={() => dispatch({ type: "open_conversation" })} type="button">进入对话</button>
          </div>
          {state.unreadLetters > 0 && <button className="letter-dot" onClick={() => dispatch({ type: "open_letter" })} type="button">✉ {state.unreadLetters} 封来信</button>}
        </section>
      )}

      {state.screen === "conversation" && (
        <section className="conversation-screen">
          <div className="home-snow">
            <div className="home-pet"><FoxMark tone={avatarTone(state.petAvatarId)} avatarId={state.petAvatarId} size="large" /></div>
            {userPreview && <div className="user-preview" aria-label="本轮说话预览"><span className="user-preview__label">你：</span><span className="user-preview__text">{userPreview}</span></div>}
            {isListening && <div className="voice-overlay" role="status"><strong>正在听你说…</strong></div>}
            <div className="home-greeting" role="status"><strong>刘看山</strong><span>{replyText}</span></div>
          </div>
          <div className="home-actions">
            <button
              className={isListening ? "recording-action" : "primary-action"}
              onPointerDown={startTalking}
              onPointerUp={finishTalking}
              onPointerCancel={() => { setIsListening(false); clearVoice(); }}
              onKeyDown={(event) => { if (!event.repeat && (event.key === " " || event.key === "Enter")) { event.preventDefault(); startTalking(); } }}
              onKeyUp={(event) => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); finishTalking(); } }}
              type="button"
            >
              {isListening ? <><span className="button-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>松开，发送</> : "按住说话"}
            </button>
          </div>
        </section>
      )}

      {state.screen === "matching" && (
        <section className="matching-screen matching-screen--meeting">
          <div className="meeting-foxes" aria-label="两只看山正在相遇">
            <div className="meeting-fox meeting-fox--mine"><FoxMark tone="snow" avatarId={state.petAvatarId} size="normal" /></div>
            <span className="meeting-spark" aria-hidden="true">✧ · ✧</span>
            <div className="meeting-fox meeting-fox--peer"><FoxMark tone="violet" avatarId="liukanshan_04" size="normal" /></div>
          </div>
        </section>
      )}

      {state.screen === "peer_reveal" && state.encounter && (
        <section className="peer-reveal-screen">
          <button className="encounter-close" aria-label="关闭，返回首页" onClick={() => { if (revealTimer.current) clearTimeout(revealTimer.current); dispatch({ type: "go_home" }); }} type="button">×</button>
          <div className="peer-reveal-scene">
            <FoxMark tone={avatarTone(state.encounter.peer_author?.pet_avatar_id ?? null)} avatarId={state.encounter.peer_author?.pet_avatar_id} size="large" />
            <p>匹配到{state.encounter.peer_author?.display_name ?? "一位看山"}</p>
          </div>
        </section>
      )}

      {state.screen === "encounter" && state.encounter && (
        <section className="encounter-screen">
          <button className="encounter-close" aria-label="关闭，返回首页" onClick={() => dispatch({ type: "go_home" })} type="button">×</button>
          <EncounterCard encounter={state.encounter} isSupportPending={supportPending} onSupport={support} onOpenZhihu={() => setPhoneHint(true)} />
          {phoneHint && <p className="phone-hint">演示：手机端将展示相关知乎内容，当前未接真实链接。</p>}
          {supportError && <p className="phone-hint">这份心意暂时没能送达，请稍后再试。</p>}
        </section>
      )}

      {state.screen === "empty" && (
        <section className="matching-screen empty-screen">
          <div className="empty-icon">⌁</div>
          <h1>这次没有遇见</h1>
          <p>晚一点再摇摇看，世界还在慢慢靠近。</p>
          <button className="primary-action" onClick={() => dispatch({ type: "go_home" })} type="button">回到首页</button>
        </section>
      )}

      {state.screen === "support_sent" && (
        <section className="support-result-screen">
          <button className="support-result-close" aria-label="关闭，返回首页" onClick={() => dispatch({ type: "go_home" })} type="button">×</button>
          <div className="envelope" aria-hidden="true">♥</div>
          <p className="eyebrow">送给{state.encounter?.peer_author?.display_name ?? "对方"}</p>
          <h1>你的助力已送出</h1>
        </section>
      )}

      {state.screen === "letter" && <LetterScreen onHome={() => dispatch({ type: "go_home" })} />}
    </DeviceShell>
  );
}
