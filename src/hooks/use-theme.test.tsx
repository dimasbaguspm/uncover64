import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "./use-theme";

const STORAGE_KEY = "uncover-theme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light");
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
  });

  it("defaults to dark without a saved preference or matchMedia", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("respects a saved light preference", () => {
    localStorage.setItem(STORAGE_KEY, "light");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("falls back to matchMedia when nothing is saved", () => {
    window.matchMedia = vi.fn(() => ({ matches: true }) as unknown as MediaQueryList);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  it("toggles between themes and persists the choice", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.theme).toBe("light");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.theme).toBe("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });
});
