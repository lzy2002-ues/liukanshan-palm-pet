import type { PetAvatarId } from "../contracts";
import liukanshanFront from "../../assets/processed/liukanshan-front-cutout.png?inline";

// Replace each value with its matching processed image when the six final assets arrive.
export const avatarImageById: Record<PetAvatarId, string> = {
  liukanshan_01: liukanshanFront,
  liukanshan_02: liukanshanFront,
  liukanshan_03: liukanshanFront,
  liukanshan_04: liukanshanFront,
  liukanshan_05: liukanshanFront,
  liukanshan_06: liukanshanFront,
};

export const avatarOptions: Array<{ id: PetAvatarId; name: string; tone: string }> = [
  { id: "liukanshan_01", name: "云朵白", tone: "snow" },
  { id: "liukanshan_02", name: "晨雾灰", tone: "mist" },
  { id: "liukanshan_03", name: "北极蓝", tone: "blue" },
  { id: "liukanshan_04", name: "晚风紫", tone: "violet" },
  { id: "liukanshan_05", name: "极光绿", tone: "mint" },
  { id: "liukanshan_06", name: "暖阳橙", tone: "peach" },
];

interface AvatarCarouselProps {
  selected: PetAvatarId;
  onSelect: (id: PetAvatarId) => void;
}

export function FoxMark({ tone = "snow", size = "normal", avatarId }: { tone?: string; size?: "small" | "normal" | "large"; avatarId?: PetAvatarId | null }) {
  return (
    <div className={`fox fox--photo fox--${tone} fox--${size}`} aria-hidden="true">
      <img src={(avatarId && avatarImageById[avatarId]) || liukanshanFront} alt="" draggable="false" />
    </div>
  );
}

export function AvatarCarousel({ selected, onSelect }: AvatarCarouselProps) {
  return (
    <div className="avatar-carousel" aria-label="选择刘看山形象">
      {avatarOptions.map((avatar) => (
        <button
          className={`avatar-choice ${selected === avatar.id ? "is-selected" : ""}`}
          key={avatar.id}
          onClick={() => onSelect(avatar.id)}
          type="button"
          aria-label={`选中 ${avatar.name}`}
        >
          <FoxMark tone={avatar.tone} avatarId={avatar.id} size="small" />
          <span>{avatar.name}</span>
        </button>
      ))}
    </div>
  );
}
