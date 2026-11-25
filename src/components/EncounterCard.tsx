import { useState } from "react";
import type { MatchedEncounter } from "../contracts";
import { FoxMark } from "./AvatarCarousel";

interface EncounterCardProps {
  encounter: MatchedEncounter;
  onSupport: (messageId: string) => void;
  onOpenPhone: () => void;
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

export function EncounterCard({ encounter, onSupport, onOpenPhone, isSupportPending }: EncounterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isPeer = encounter.content_type === "peer_post";
  const sourceLabel = encounter.source === "demo" ? "演示内容 · 知乎经验" : isPeer ? "匿名奇遇" : "知乎经验";
  const avatarTone = encounter.peer_author
    ? toneByAvatar[encounter.peer_author.pet_avatar_id] ?? "snow"
    : "blue";

  return (
    <div className="encounter-card" data-content-type={encounter.content_type} data-source={encounter.source}>
      <div className="encounter-card__topline">
        <span className={`source-pill ${isPeer ? "source-pill--warm" : ""}`}>
          {sourceLabel}
        </span>
        <span className="source-pill source-pill--quiet">{encounter.match_mode === "contextual" ? "刚才的你" : "随机遇见"}</span>
      </div>
      <div className="encounter-card__character">
        {isPeer ? <FoxMark tone={avatarTone} size="large" /> : <span className="zhihu-mark">知</span>}
        <p className="encounter-card__author">{encounter.peer_author?.display_name ?? encounter.zhihu_content?.author_name ?? "知乎内容"}</p>
      </div>
      <div className="encounter-card__speech">
        <h2>{encounter.title}</h2>
        <p className="encounter-card__summary">{encounter.summary}</p>
      </div>
      <button className="expand-action" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} type="button">{expanded ? "收起内容 ↑" : "展开看看 ↓"}</button>
      {expanded && <div className="encounter-card__detail"><p>{encounter.match_reason}</p><small>{isPeer ? "仅展示对方确认公开的匿名内容" : "完整内容请前往知乎查看"}</small></div>}
      {encounter.can_support ? (
        <div className="support-row">
          {encounter.support_options.map((option) => (
            <button disabled={isSupportPending} key={option.message_id} onClick={() => onSupport(option.message_id)} type="button">
              {isSupportPending ? "正在送出…" : option.label}
            </button>
          ))}
        </div>
      ) : (
        <button className="outline-action" onClick={onOpenPhone} type="button">
          去手机看详情
        </button>
      )}
    </div>
  );
}
