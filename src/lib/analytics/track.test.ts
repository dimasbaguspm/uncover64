import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "./track";

const track = vi.fn();

beforeEach(() => {
  track.mockClear();
  (window as unknown as { umami: unknown }).umami = {
    track,
    version: "1.2.3",
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("trackEvent", () => {
  it("dispatches to the umami tracker with enriched metadata", () => {
    window.history.pushState({}, "", "/");
    trackEvent("file_drop", { name: "a.txt" });

    expect(track).toHaveBeenCalledWith(
      "file_drop",
      expect.objectContaining({
        provider: "umami",
        providerVersion: "1.2.3",
        sessionId: expect.any(String),
        page: "/",
        name: "a.txt",
      }),
    );
  });

  it("masks uuid paths before dispatch", () => {
    window.history.pushState({}, "", "/encode/123e4567-e89b-12d3-a456-426614174000");
    trackEvent("page_view");
    expect(track.mock.calls[0][1].page).toBe("/encode/[id]");
  });

  it("overrides session metadata with explicit attributes", () => {
    trackEvent("encode", { name: "override" });
    expect(track.mock.calls[0][1]).toMatchObject({ name: "override" });
  });

  it("survives a missing umami tracker", () => {
    delete (window as unknown as { umami: unknown }).umami;
    expect(() => trackEvent("page_view")).not.toThrow();
  });
});
