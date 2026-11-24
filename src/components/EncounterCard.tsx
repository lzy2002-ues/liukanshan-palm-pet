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
      <div className="encounter-card__body">
        {isPeer ? <FoxMark tone={avatarTone} size="small" /> : <span className="zhihu-mark">知</span>}
        <div>
          <p className="encounter-card__author">
            {encounter.peer_author?.display_name ?? encounter.zhihu_content?.author_name ?? "知乎内容"}
          </p>
          <h2>{encounter.title}</h2>
        </div>
      </div>
      <p className="encounter-card__summary">{encounter.summary}</p>
      <p className="encounter-card__reason">{encounter.match_reason}</p>
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
