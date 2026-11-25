import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("摇一摇掌机 Mock", () => {
  it("lets a first-time user choose an avatar and enter the device home", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "选中 北极蓝" }));
    await user.click(screen.getByRole("button", { name: "我选好了" }));

    expect(screen.getByText("今天也陪着你")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "摇一摇遇见" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "模拟摇动设备" })).toBeInTheDocument();
  });

  it("shows listening feedback and a brief bubble on the home screen", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "选中 北极蓝" }));
    await user.click(screen.getByRole("button", { name: "我选好了" }));
    fireEvent.pointerDown(screen.getByRole("button", { name: "按住说话" }));
    expect(screen.getByText("正在听你说…")).toBeInTheDocument();
    fireEvent.pointerUp(screen.getByRole("button", { name: "松开，发送" }));

    expect(screen.getByText("你：最近找工作有点焦虑。" )).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "按住说话" })).toBeInTheDocument();
  });

  it("confirms sent support without showing the sender a received letter", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "选中 北极蓝" }));
    await user.click(screen.getByRole("button", { name: "我选好了" }));
    await user.click(screen.getByRole("button", { name: "模拟摇动设备" }));

    expect(screen.getByLabelText("两只看山正在相遇")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("找工作时总觉得自己不够好，怎么办？")).toBeInTheDocument(), { timeout: 3500 });
    await user.click(screen.getByRole("button", { name: "展开看看 ↓" }));
    expect(screen.getByText("仅展示对方确认公开的匿名内容")).toBeInTheDocument();
    const supportButton = screen.getByRole("button", { name: "按住送个抱抱" });
    fireEvent.pointerDown(supportButton);
    await new Promise((resolve) => setTimeout(resolve, 750));
    fireEvent.pointerUp(supportButton);

    await waitFor(() => expect(screen.getByText("这份温柔已经出发啦。" )).toBeInTheDocument());
    expect(screen.queryByText("一封新的来信")).not.toBeInTheDocument();
  });
});
