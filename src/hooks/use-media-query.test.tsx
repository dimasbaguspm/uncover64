import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "./use-media-query";

function makeMql(initial: boolean) {
  const listeners: Array<() => void> = [];
  const removeListener = vi.fn();
  const mql = {
    matches: initial,
    addEventListener: (_event: string, cb: () => void) => {
      listeners.push(cb);
    },
    removeEventListener: (_event: string, cb: () => void) => {
      removeListener(cb);
      const i = listeners.indexOf(cb);
      if (i >= 0) listeners.splice(i, 1);
    },
  };
  return { mql, listeners, removeListener };
}

describe("useMediaQuery", () => {
  it("returns false when matchMedia is unavailable", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("returns the initial match state", () => {
    const { mql } = makeMql(true);
    window.matchMedia = vi.fn(() => mql) as unknown as typeof window.matchMedia;
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("updates when the media query changes", () => {
    const { mql, listeners } = makeMql(false);
    window.matchMedia = vi.fn(() => mql) as unknown as typeof window.matchMedia;
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

    expect(result.current).toBe(false);
    act(() => {
      mql.matches = true;
      listeners.forEach((l) => l());
    });
    expect(result.current).toBe(true);
  });

  it("removes its listener on unmount", () => {
    const { mql, removeListener } = makeMql(false);
    window.matchMedia = vi.fn(() => mql) as unknown as typeof window.matchMedia;
    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    unmount();
    expect(removeListener).toHaveBeenCalledTimes(1);
  });
});
