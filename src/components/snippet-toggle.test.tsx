import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SnippetToggle } from "./snippet-toggle";

describe("SnippetToggle", () => {
  it("renders both language buttons", () => {
    render(<SnippetToggle value="node" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Node.js" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
  });

  it("fires onChange with the selected language", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SnippetToggle value="node" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onChange).toHaveBeenCalledWith("go");
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
