import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FullscreenViewer } from "./fullscreen-viewer";

function renderViewer(overrides: Partial<Parameters<typeof FullscreenViewer>[0]> = {}) {
  const onNav = vi.fn();
  const onClose = vi.fn();
  render(
    <FullscreenViewer
      index={0}
      total={3}
      label="Gzip · 70%"
      loading={false}
      onNav={onNav}
      onClose={onClose}
      {...overrides}
    >
      content-body
    </FullscreenViewer>,
  );
  return { onNav, onClose };
}

describe("FullscreenViewer", () => {
  it("renders the label, counter and children", () => {
    renderViewer();
    expect(screen.getByText("Gzip · 70%")).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByText("content-body")).toBeInTheDocument();
  });

  it("marks the variation as recommended", () => {
    renderViewer({ recommended: true });
    expect(screen.getByText(/Recommended/)).toBeInTheDocument();
  });

  it("shows a shimmer instead of children while loading", () => {
    renderViewer({ loading: true });
    expect(screen.queryByText("content-body")).not.toBeInTheDocument();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("navigates with the arrow buttons", async () => {
    const user = userEvent.setup();
    const { onNav } = renderViewer();
    await user.click(screen.getByRole("button", { name: "Previous variation" }));
    await user.click(screen.getByRole("button", { name: "Next variation" }));
    expect(onNav).toHaveBeenNthCalledWith(1, -1);
    expect(onNav).toHaveBeenNthCalledWith(2, 1);
  });

  it("hides arrow buttons when there is a single variation", () => {
    renderViewer({ total: 1 });
    expect(screen.queryByRole("button", { name: "Previous variation" })).not.toBeInTheDocument();
  });

  it("responds to keyboard navigation and escape", () => {
    const { onNav, onClose } = renderViewer();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onNav).toHaveBeenNthCalledWith(1, -1);
    expect(onNav).toHaveBeenNthCalledWith(2, 1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes via the close button", async () => {
    const user = userEvent.setup();
    const { onClose } = renderViewer();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
