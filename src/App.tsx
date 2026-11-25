import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import { requestEncounter, sendSupport } from "./api/encounterApi";
import type { PetAvatarId } from "./contracts";
import { AvatarCarousel, avatarOptions, FoxMark } from "./components/AvatarCarousel";
import { DeviceShell } from "./components/DeviceShell";
import { EncounterCard } from "./components/EncounterCard";
import { LetterScreen } from "./components/LetterScreen";
import { createInitialDeviceState, deviceReducer } from "./state/deviceReducer";

const formatTime = () => new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

function avatarTone(id: PetAvatarId | null) {
  return avatarOptions.find((option) => option.id === id)?.tone ?? "snow";
}

export default function App() {
  const [state, dispatch] = useReducer(deviceReducer, undefined, () => createInitialDeviceState());
  const [selectedAvatar, setSelectedAvatar] = useState<PetAvatarId>("liukanshan_03");
  const [isListening, setIsListening] = useState(false);
  const [voicePhase, setVoicePhase] = useState<"idle" | "user" | "pet" | "action">("idle");
  const [phoneHint, setPhoneHint] = useState(false);
  const [supportPending, setSupportPending] = useState(false);
  const [supportError, setSupportError] = useState(false);
  const shakeInFlight = useRef(false);
  const supportInFlight = useRef(false);
  const matchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const displayTime = useMemo(formatTime, []);
  const voiceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceRun = useRef(0);

  useEffect(() => () => {
    if (voiceTimer.current) clearTimeout(voiceTimer.current);
    if (matchTimer.current) clearTimeout(matchTimer.current);
  }, []);

  const clearVoice = () => {
    voiceRun.current += 1;
    if (voiceTimer.current) clearTimeout(voiceTimer.current);
    setVoicePhase("idle");
  };

  const startTalking = () => {
    clearVoice();
    setIsListening(true);
    dispatch({ type: "talk_started" });
  };

  const finishTalking = () => {
    if (!isListening) return;
    setIsListening(false);
    dispatch({
      type: "conversation_updated",
      bubbles: [
        { id: "pet-welcome", role: "pet", text: "我在呢，慢慢说也没关系。" },
        { id: "user-job", role: "user", text: "最近找工作有点焦虑。" },
        { id: "pet-answer", role: "pet", text: "听起来你扛了很多，我陪你慢一点整理。" },
      ],
      showZhihuSuggestion: false,
    });
    const run = ++voiceRun.current;
    setVoicePhase("user");
    voiceTimer.current = setTimeout(() => {
      if (run !== voiceRun.current) return;
      setVoicePhase("pet");
      voiceTimer.current = setTimeout(() => {
        if (run !== voiceRun.current) return;
        setVoicePhase("action");
        voiceTimer.current = setTimeout(() => { if (run === voiceRun.current) setVoicePhase("idle"); }, 5000);
      }, 4500);
    }, 2300);
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
      matchTimer.current = setTimeout(() => dispatch({ type: "encounter_received", encounter: response.data }), 1800);
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
      await sendSupport(state.encounter.encounter_id, {
        message_id: messageId,
        client_request_id: `support-${crypto.randomUUID()}`,
      });
      dispatch({ type: "support_delivered" });
    } catch {
      setSupportError(true);
    } finally {
      supportInFlight.current = false;
      setSupportPending(false);
    }
  };

  return (
    <DeviceShell label="刘看山掌机交互演示" onSimulateShake={shake} showSimulator={state.screen === "home"}>
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
          <header className="status-line"><span>{displayTime}</span><span>● 已连接</span></header>
          <div className="home-snow"><div className="home-pet"><FoxMark tone={avatarTone(state.petAvatarId)} size="large" /></div>
            {isListening && <div className="voice-overlay" role="status"><span className="voice-wave" aria-hidden="true">▂ ▅ ▇ ▃ ▆ ▂</span><strong>正在听你说…</strong></div>}
            {!isListening && voicePhase !== "idle" && <div className={`voice-bubble voice-bubble--${voicePhase}`} role="status">{voicePhase === "user" ? "你：最近找工作有点焦虑。" : "刘看山：我记住啦，想不想遇见有相似经历的小看山？"}</div>}
          </div>
          <p className="eyebrow">刘看山在这儿</p>
          <h1>今天也陪着你</h1>
          {voicePhase === "action" ? <p className="home-copy">想遇见相似经历？轻轻摇动掌机。</p> : <p className="home-copy">想说什么都可以。摇一摇，也许会遇见一封刚好懂你的信。</p>}
          <div className="home-actions">
            <button className={isListening ? "recording-action" : "ghost-action"} onClick={isListening ? finishTalking : startTalking} type="button">{isListening ? "松开，发送" : "按住说话"}</button>
          </div>
          {state.unreadLetters > 0 && <button className="letter-dot" onClick={() => dispatch({ type: "open_letter" })} type="button">✉ {state.unreadLetters} 封来信</button>}
        </section>
      )}

      {state.screen === "matching" && (
        <section className="matching-screen">
          <div className="meeting-foxes" aria-label="两只看山正在相遇">
            <div className="meeting-fox meeting-fox--mine"><FoxMark tone={avatarTone(state.petAvatarId)} size="normal" /><small>我的看山</small></div>
            <span className="meeting-spark" aria-hidden="true">✧ · ✧</span>
            <div className="meeting-fox meeting-fox--peer"><FoxMark tone="violet" size="normal" /><small>远方的小看山</small></div>
          </div>
          <h1>正在遇见…</h1>
          <p>刘看山正在替你翻一翻世界。</p>
        </section>
      )}

      {state.screen === "encounter" && state.encounter && (
        <section className="encounter-screen">
          <header className="conversation-header"><span /><span>摇一摇奇遇</span><button aria-label="关闭，返回首页" onClick={() => dispatch({ type: "go_home" })} type="button">×</button></header>
          <EncounterCard encounter={state.encounter} isSupportPending={supportPending} onSupport={support} onOpenPhone={() => setPhoneHint(true)} />
          {phoneHint && <p className="phone-hint">已为手机端准备详情入口</p>}
          {supportError && <p className="phone-hint">这份心意暂时没能送达，请稍后再试。</p>}
          <button className="text-action" onClick={() => dispatch({ type: "go_home" })} type="button">先回去</button>
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
        <section className="letter-screen">
          <div className="envelope" aria-hidden="true">✉</div>
          <p className="eyebrow">你的鼓励</p>
          <h1>这份温柔已经出发啦。</h1>
          <p>如果通过审核，它会成为对方的一封刘看山来信。</p>
          <button className="primary-action" onClick={() => dispatch({ type: "go_home" })} type="button">回到首页</button>
        </section>
      )}

      {state.screen === "letter" && <LetterScreen onHome={() => dispatch({ type: "go_home" })} />}
    </DeviceShell>
  );
}
