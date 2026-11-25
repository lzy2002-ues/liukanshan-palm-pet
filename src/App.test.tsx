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

    expect(screen.getByText("我在这儿。想说什么，慢慢告诉我。")).toBeInTheDocument();
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

    expect(screen.queryByText("你：最近找工作有点焦虑。")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("刘看山：我记住啦，想不想遇见有相似经历的小看山？")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "按住说话" })).toBeInTheDocument();
  });

  it("confirms sent support without showing the sender a received letter", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "选中 北极蓝" }));
    await user.click(screen.getByRole("button", { name: "我选好了" }));
    await user.click(screen.getByRole("button", { name: "模拟摇动设备" }));

    expect(screen.getByLabelText("两只看山正在相遇")).toBeInTheDocument();
    expect(screen.queryByText("远方的小看山")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("找工作时总觉得自己不够好，怎么办？")).toBeInTheDocument(), { timeout: 3500 });
    expect(screen.getByText("小野看山分享了")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /展开|收起/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /知乎/ })).not.toBeInTheDocument();
    expect(screen.queryByText("anon_8f2b")).not.toBeInTheDocument();
    const supportButton = screen.getByRole("button", { name: "按住助力" });
    fireEvent.pointerDown(supportButton);
    await new Promise((resolve) => setTimeout(resolve, 750));
    fireEvent.pointerUp(supportButton);

    await waitFor(() => expect(screen.getByText("你的助力已送出" )).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "关闭，返回首页" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "回到首页" })).not.toBeInTheDocument();
    expect(screen.queryByText("一封新的来信")).not.toBeInTheDocument();
  });
});
