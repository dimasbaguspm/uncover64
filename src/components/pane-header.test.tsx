import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PaneHeader } from "./pane-header";

describe("PaneHeader", () => {
  it("renders the title", () => {
    render(<PaneHeader title="Preview" />);
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("renders the right node when provided", () => {
    render(<PaneHeader title="Preview" right={<button type="button">action</button>} />);
    expect(screen.getByRole("button", { name: "action" })).toBeInTheDocument();
  });

  it("omits the right side when absent", () => {
    const { container } = render(<PaneHeader title="Preview" />);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });
});
