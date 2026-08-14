import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useClipboard } from "./use-clipboard";

function stubClipboard(writeText: unknown) {
  vi.stubGlobal("navigator", { clipboard: { writeText } });
}

describe("useClipboard", () => {
  beforeEach(() => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("copies text and toggles copied state", async () => {
    const { result } = renderHook(() => useClipboard());

    expect(result.current.copied).toBe(false);

    await act(async () => {
      await result.current.copy("hello");
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello");
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.copied).toBe(false);
  });

  it("resets copied state when clipboard access is denied", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy("hello");
    });
    expect(result.current.copied).toBe(false);
  });
});
