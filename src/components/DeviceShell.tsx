import type { ReactNode } from "react";

interface DeviceShellProps {
  children: ReactNode;
  label: string;
}

export function DeviceShell({ children, label }: DeviceShellProps) {
  return (
    <main className="stage">
      <section className="device" aria-label={label}>
        <div className="device__notch" aria-hidden="true" />
        <div className="device__screen">{children}</div>
        <div className="device__chin" aria-hidden="true">
          <span />
        </div>
      </section>
      <p className="preview-note">浏览器 Mock · 480 × 480 设备屏幕</p>
    </main>
  );
}
