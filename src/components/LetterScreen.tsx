import { FoxMark } from "./AvatarCarousel";

export function LetterScreen({ onHome }: { onHome: () => void }) {
  return (
    <section className="letter-screen">
      <div className="envelope" aria-hidden="true">✉</div>
      <FoxMark tone="peach" size="small" />
      <p className="eyebrow">刘看山来信</p>
      <h1>一封新的来信</h1>
      <p>这份温柔已经出发啦。</p>
      <div className="letter-paper">
        <span>来自一只小看山</span>
        <strong>“抱抱你，你已经很努力了。”</strong>
      </div>
      <button className="primary-action" onClick={onHome} type="button">回到首页</button>
    </section>
  );
}
