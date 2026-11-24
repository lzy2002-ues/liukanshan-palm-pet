import type { PetAvatarId } from "../contracts";

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

export function FoxMark({ tone = "snow", size = "normal" }: { tone?: string; size?: "small" | "normal" | "large" }) {
  return (
    <div className={`fox fox--${tone} fox--${size}`} aria-hidden="true">
      <span className="fox__ear fox__ear--left" />
      <span className="fox__ear fox__ear--right" />
      <span className="fox__face">
        <i className="fox__eye fox__eye--left" />
        <i className="fox__eye fox__eye--right" />
        <i className="fox__nose" />
      </span>
      <span className="fox__body" />
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
          <FoxMark tone={avatar.tone} size="small" />
          <span>{avatar.name}</span>
        </button>
      ))}
    </div>
  );
}
