import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FileInfo } from "@/lib/types";
import { trackEvent } from "@/lib/analytics/track";
import { PreviewPanel, type PreviewData } from "./preview-panel";

vi.mock("@/lib/analytics/track", () => ({ trackEvent: vi.fn() }));

function info(overrides: Partial<FileInfo> = {}): FileInfo {
  return {
    kind: "text",
    mime: "text/plain",
    ext: "txt",
    label: "TXT",
    ...overrides,
  };
}

function renderPanel(overrides: Partial<PreviewData> = {}) {
  return render(
    <PreviewPanel
      bytes={new TextEncoder().encode("hello")}
      info={info()}
      sizeBytes={5}
      text="hello world"
      {...overrides}
    />,
  );
}

describe("PreviewPanel", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:mock") as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;
  });

  it("renders the decoded text", () => {
    renderPanel();
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("renders a binary fallback with size and extension", () => {
    renderPanel({
      info: info({ kind: "zip", mime: "application/zip", ext: "zip", label: "ZIP" }),
      sizeBytes: 2048,
      text: undefined,
    });
    expect(screen.getByText(/Binary payload/)).toBeInTheDocument();
    expect(screen.getByText(/decoded\.zip/)).toBeInTheDocument();
  });

  it("renders an image with zoom controls and clamps the zoom", async () => {
    const user = userEvent.setup();
    renderPanel({
      info: info({ kind: "png", mime: "image/png", ext: "png", label: "PNG" }),
      image: { width: 100, height: 50 },
      text: undefined,
    });

    const img = screen.getByAltText("Preview");
    expect(img).toHaveAttribute("src", "blob:mock");

    const zoomIn = screen.getByRole("button", { name: "Zoom in" });
    await user.click(zoomIn);
    expect(screen.getByText("125%")).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith("preview_zoom", { direction: "in" });

    for (let i = 0; i < 20; i += 1) await user.click(zoomIn);
    expect(screen.getByText("400%")).toBeInTheDocument();
  });

  it("tracks zoom-out and clamps at the minimum", async () => {
    const user = userEvent.setup();
    renderPanel({
      info: info({ kind: "png", mime: "image/png", ext: "png", label: "PNG" }),
      image: { width: 100, height: 50 },
      text: undefined,
    });

    const zoomOut = screen.getByRole("button", { name: "Zoom out" });
    for (let i = 0; i < 10; i += 1) await user.click(zoomOut);
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith("preview_zoom", { direction: "out" });
  });

  it("opens fullscreen and the object url in a new tab", async () => {
    const user = userEvent.setup();
    const onFullscreen = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderPanel({
      info: info({ kind: "png", mime: "image/png", ext: "png", label: "PNG" }),
      image: { width: 100, height: 50 },
      text: undefined,
      onFullscreen,
    });

    await user.click(screen.getByRole("button", { name: "Full screen" }));
    expect(onFullscreen).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Open in new tab" }));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it("shows the compression badge in compression mode", () => {
    renderPanel({ compression: "Gzip · 70%", selectedSize: 300 });
    expect(screen.getByText(/Compression · Gzip · 70%/)).toBeInTheDocument();
    expect(screen.getByText("300 B")).toBeInTheDocument();
  });

  it("omits the fullscreen button without onFullscreen", () => {
    renderPanel();
    expect(screen.queryByRole("button", { name: "Full screen" })).not.toBeInTheDocument();
  });
});
