import { useMemo, useReducer, useRef, useState } from "react";

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
  const [phoneHint, setPhoneHint] = useState(false);
  const [supportPending, setSupportPending] = useState(false);
  const [supportError, setSupportError] = useState(false);
  const shakeInFlight = useRef(false);
  const supportInFlight = useRef(false);
  const displayTime = useMemo(formatTime, []);

  const startTalking = () => {
    setIsListening(true);
    dispatch({ type: "talk_started" });
  };

  const finishTalking = () => {
    setIsListening(false);
    dispatch({
      type: "conversation_updated",
      bubbles: [
        { id: "pet-welcome", role: "pet", text: "我在呢，慢慢说也没关系。" },
        { id: "user-job", role: "user", text: "最近找工作有点焦虑。" },
        { id: "pet-answer", role: "pet", text: "听起来你扛了很多，我陪你慢一点整理。" },
      ],
      showZhihuSuggestion: true,
    });
  };

  const shake = async () => {
    if (shakeInFlight.current || state.screen === "matching") return;
    shakeInFlight.current = true;
    const sessionId = state.screen === "conversation" ? "ses_zhihu_help" : "ses_job_search";
    dispatch({ type: "shake_started" });
    try {
      const response = await requestEncounter({
        request_id: `mock-${crypto.randomUUID()}`,
        session_id: sessionId,
        trigger_source: "mock",
        client_triggered_at: new Date().toISOString(),
      });
      dispatch({ type: "encounter_received", encounter: response.data });
    } catch {
      dispatch({
        type: "encounter_received",
        encounter: { status: "empty", encounter_id: null, empty_reason: "no_eligible_content", retry_after_seconds: 30 },
      });
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
    <DeviceShell label="刘看山掌机交互演示">
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
          <div className="home-pet"><FoxMark tone={avatarTone(state.petAvatarId)} size="large" /></div>
          <p className="eyebrow">刘看山在这儿</p>
          <h1>今天也陪着你</h1>
          <p className="home-copy">想说什么都可以。摇一摇，也许会遇见一封刚好懂你的信。</p>
          <div className="home-actions">
            <button className="ghost-action" onClick={startTalking} type="button">按住说话</button>
            <button className="primary-action" onClick={shake} type="button">摇一摇遇见</button>
          </div>
          {state.unreadLetters > 0 && <button className="letter-dot" onClick={() => dispatch({ type: "open_letter" })} type="button">✉ {state.unreadLetters} 封来信</button>}
        </section>
      )}

      {state.screen === "conversation" && (
        <section className="conversation-screen">
          <header className="conversation-header"><button onClick={() => dispatch({ type: "go_home" })} type="button">‹</button><span>{isListening ? "刘看山在听" : "刘看山陪你聊"}</span><span className="connection-dot">●</span></header>
          <div className="conversation-list">
            {state.conversation.map((bubble) => <p key={bubble.id} className={`bubble bubble--${bubble.role}`}>{bubble.text}</p>)}
            {state.showZhihuSuggestion && (
              <article className="mini-zhihu-card">
                <span>知乎经验</span>
                <strong>求职低谷期，如何恢复节奏？</strong>
                <button onClick={() => setPhoneHint(true)} type="button">去手机看详情</button>
              </article>
            )}
            {phoneHint && <p className="phone-hint">已为手机端准备详情入口</p>}
          </div>
          <div className="conversation-actions">
            {isListening ? <button aria-label="松开发送" className="recording-action" onClick={finishTalking} type="button">● 松开发送</button> : <button className="ghost-action" onClick={startTalking} type="button">按住继续说</button>}
            <button className="primary-action" onClick={shake} type="button">摇一摇</button>
          </div>
        </section>
      )}

      {state.screen === "matching" && (
        <section className="matching-screen">
          <div className="shake-orbit" aria-hidden="true">✧</div>
          <FoxMark tone={avatarTone(state.petAvatarId)} size="normal" />
          <h1>正在遇见…</h1>
          <p>刘看山正在替你翻一翻世界。</p>
        </section>
      )}

      {state.screen === "encounter" && state.encounter && (
        <section className="encounter-screen">
          <header className="conversation-header"><button onClick={() => dispatch({ type: "go_home" })} type="button">‹</button><span>摇一摇奇遇</span><span /></header>
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
