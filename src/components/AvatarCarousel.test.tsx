import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { AvatarCarousel, FoxMark } from "./AvatarCarousel";

it("keeps every IP image self contained in embedded previews", () => {
  const { container } = render(<><FoxMark avatarId="liukanshan_04" /><AvatarCarousel selected="liukanshan_01" onSelect={() => {}} /></>);
  const images = container.querySelectorAll("img");
  expect(images).toHaveLength(7);
  for (const image of images) expect(image.src).toMatch(/^data:image\/png;base64,/);
  expect(screen.getByRole("button", { name: "选中 云朵白" })).toBeInTheDocument();
}, 15000);
