import { useEffect, useRef, useState } from "react";
import type { MatchedEncounter } from "../contracts";
import { FoxMark } from "./AvatarCarousel";

interface EncounterCardProps {
  encounter: MatchedEncounter;
  onSupport: (messageId: string) => void;
  onOpenZhihu: () => void;
  isSupportPending: boolean;
}

const toneByAvatar: Record<string, string> = {
  liukanshan_01: "snow",
  liukanshan_02: "mist",
  liukanshan_03: "blue",
  liukanshan_04: "violet",
  liukanshan_05: "mint",
  liukanshan_06: "peach",
};

export function EncounterCard({ encounter, onSupport, onOpenZhihu, isSupportPending }: EncounterCardProps) {
  const [isHolding, setIsHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (holdTimer.current) clearTimeout(holdTimer.current); }, []);
  const isPeer = encounter.content_type === "peer_post";
  const avatarTone = encounter.peer_author
    ? toneByAvatar[encounter.peer_author.pet_avatar_id] ?? "snow"
    : "blue";
  const supportOption = encounter.support_options[0];
  const cancelHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setIsHolding(false);
  };
  const beginHold = () => {
    if (!supportOption || isSupportPending) return;
    setIsHolding(true);
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      setIsHolding(false);
      onSupport(supportOption.message_id);
    }, 700);
  };

  return (
    <div className="encounter-card" data-content-type={encounter.content_type} data-source={encounter.source}>
      <div className="encounter-card__character">
        {isPeer ? <FoxMark tone={avatarTone} size="large" /> : <FoxMark tone="snow" size="large" />}
      </div>
      <div className="encounter-card__speech">
        <strong>{isPeer ? `${encounter.peer_author?.display_name ?? "一位看山"}分享了` : "刘看山发现了"}</strong>
        <h2>{encounter.title}</h2>
        <p className="encounter-card__summary">{encounter.summary}</p>
      </div>
      {encounter.can_support ? (
        <div className="encounter-actions">
          <button
            className={`support-hold ${isHolding ? "is-holding" : ""}`}
            disabled={isSupportPending || !supportOption}
            onPointerDown={beginHold}
            onPointerUp={cancelHold}
            onPointerLeave={cancelHold}
            onPointerCancel={cancelHold}
            onKeyDown={(event) => { if (!event.repeat && (event.key === " " || event.key === "Enter")) { event.preventDefault(); beginHold(); } }}
            onKeyUp={(event) => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); cancelHold(); } }}
            type="button"
          >
            <span className="support-hold__fill" aria-hidden="true" />
            <span className="support-hold__heart" aria-hidden="true">♥</span>
            <span className="support-hold__copy">{isSupportPending ? "送出中" : isHolding ? "再等等" : "按住助力"}</span>
          </button>
        </div>
      ) : (
        <button className="encounter-zhihu-action" onClick={onOpenZhihu} type="button">{encounter.source === "demo" ? "演示：前往知乎查看" : "前往知乎查看 ↗"}</button>
      )}
    </div>
  );
}
