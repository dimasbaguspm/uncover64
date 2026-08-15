import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toggle } from "./toggle";

const options = [
  { id: "node", label: "Node" },
  { id: "go", label: "Go" },
];

describe("Toggle", () => {
  it("renders every option with the active one pressed", () => {
    render(<Toggle value="node" options={options} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Node" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute("aria-pressed", "false");
  });

  it("fires onChange with the pressed option id", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle value="node" options={options} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onChange).toHaveBeenCalledWith("go");
  });

  it("applies an extra class name", () => {
    const { container } = render(
      <Toggle value="node" options={options} onChange={vi.fn()} className="mx-2" />,
    );
    expect(container.firstChild).toHaveClass("mx-2");
  });
});
