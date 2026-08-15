import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DropOverlay } from "./drop-overlay";

describe("DropOverlay", () => {
  it("renders nothing when inactive", () => {
    const { container } = render(<DropOverlay active={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the drop prompt when active", () => {
    render(<DropOverlay active />);
    expect(screen.getByText("Drop a file")).toBeInTheDocument();
  });
});
