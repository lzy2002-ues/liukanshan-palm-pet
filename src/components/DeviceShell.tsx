import type { CSSProperties, ReactNode } from "react";

interface DeviceShellProps {
  children: ReactNode;
  label: string;
  onSimulateShake?: () => void;
  showSimulator?: boolean;
  sceneBackgroundUrl: string;
}

export function DeviceShell({ children, label, onSimulateShake, showSimulator, sceneBackgroundUrl }: DeviceShellProps) {
  return (
    <main className="stage">
      <section className="device" aria-label={label}>
        <div className="device__screen" style={{ "--scene-background-image": `url("${sceneBackgroundUrl}")` } as CSSProperties}>{children}</div>
      </section>
      <div className="preview-controls">
        <p className="preview-note">电脑预览 · 实机由加速度计检测摇动</p>
        {showSimulator && <button className="simulate-shake" onClick={onSimulateShake} type="button">模拟摇动设备</button>}
      </div>
    </main>
  );
}
