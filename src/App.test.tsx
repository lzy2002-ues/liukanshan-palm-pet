import { render, screen, waitFor } from "@testing-library/react";
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
    expect(screen.getByRole("button", { name: "摇一摇遇见" })).toBeInTheDocument();
  });

  it("shows a compact conversation and Zhihu card after a simulated voice turn", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "选中 北极蓝" }));
    await user.click(screen.getByRole("button", { name: "我选好了" }));
    await user.click(screen.getByRole("button", { name: "按住说话" }));
    await user.click(screen.getByRole("button", { name: "松开发送" }));

    expect(screen.getByText("最近找工作有点焦虑。" )).toBeInTheDocument();
    expect(screen.getByText("知乎经验")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "去手机看详情" })).toBeInTheDocument();
  });

  it("confirms sent support without showing the sender a received letter", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "选中 北极蓝" }));
    await user.click(screen.getByRole("button", { name: "我选好了" }));
    await user.click(screen.getByRole("button", { name: "摇一摇遇见" }));

    await waitFor(() => expect(screen.getByText("找工作时总觉得自己不够好，怎么办？")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "抱抱你" }));

    await waitFor(() => expect(screen.getByText("这份温柔已经出发啦。" )).toBeInTheDocument());
    expect(screen.queryByText("一封新的来信")).not.toBeInTheDocument();
  });
});
