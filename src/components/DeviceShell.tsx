import type { ReactNode } from "react";

interface DeviceShellProps {
  children: ReactNode;
  label: string;
  onSimulateShake?: () => void;
  showSimulator?: boolean;
}

export function DeviceShell({ children, label, onSimulateShake, showSimulator }: DeviceShellProps) {
  return (
    <main className="stage">
      <section className="device" aria-label={label}>
        <div className="device__notch" aria-hidden="true" />
        <div className="device__screen">{children}</div>
        <div className="device__chin" aria-hidden="true">
          <span />
        </div>
      </section>
      <div className="preview-controls">
        <p className="preview-note">电脑预览 · 实机由加速度计检测摇动</p>
        {showSimulator && <button className="simulate-shake" onClick={onSimulateShake} type="button">模拟摇动设备</button>}
      </div>
    </main>
  );
}
