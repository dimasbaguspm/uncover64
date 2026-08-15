import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GithubIcon } from "./github-icon";

describe("GithubIcon", () => {
  it("renders an svg with the default size", () => {
    const { container } = render(<GithubIcon />);
    const svg = container.querySelector("svg")!;
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("respects size, color, and extra svg props", () => {
    const { container } = render(<GithubIcon size={14} color="red" data-testid="gh" />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("width", "14");
    expect(svg).toHaveAttribute("height", "14");
    expect(svg).toHaveAttribute("stroke", "red");
    expect(svg).toHaveAttribute("data-testid", "gh");
  });
});
