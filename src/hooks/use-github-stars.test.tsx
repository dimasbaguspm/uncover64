import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGithubStars } from "./use-github-stars";

const CACHE_KEY = "uncover64:github-stars";
const TTL_MS = 24 * 60 * 60 * 1000;

const logWarn = vi.fn();
vi.mock("@/lib/analytics/otel", () => ({
  logWarn: (...args: unknown[]) => logWarn(...args),
  logDebug: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

const okResponse = (stars: number) => ({
  ok: true,
  json: async () => ({ stargazers_count: stars }),
});

function seedCache(value: number, at: number) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ value, at }));
}

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
  key(index: number) {
    return [...this.store.keys()][index] ?? null;
  }
}

describe("useGithubStars", () => {
  const storage = new MemoryStorage();

  beforeEach(() => {
    vi.clearAllMocks();
    storage.clear();
    vi.stubGlobal("localStorage", storage);
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches stars once on mount and returns them", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(123));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useGithubStars());
    await waitFor(() => expect(result.current).toBe(123));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/dimasbaguspm/uncover64",
      expect.any(Object),
    );
  });

  it("uses the cached value without fetching within the TTL", () => {
    seedCache(42, Date.now());
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useGithubStars());
    expect(result.current).toBe(42);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refetches after the 24h TTL expires", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    seedCache(42, Date.now());
    const fetchMock = vi.fn().mockResolvedValue(okResponse(123));
    vi.stubGlobal("fetch", fetchMock);

    const first = renderHook(() => useGithubStars());
    expect(first.result.current).toBe(42);
    expect(fetchMock).not.toHaveBeenCalled();

    first.unmount();
    vi.advanceTimersByTime(TTL_MS + 1);

    const second = renderHook(() => useGithubStars());
    expect(second.result.current).toBeNull();
    await act(async () => {});
    expect(second.result.current).toBe(123);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("dedupes concurrent fetches across mounts", async () => {
    let resolveFetch: (value: unknown) => void;
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const first = renderHook(() => useGithubStars());
    const second = renderHook(() => useGithubStars());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch!(okResponse(7));
    });
    await waitFor(() => expect(first.result.current).toBe(7));
    await waitFor(() => expect(second.result.current).toBe(7));
  });

  it("returns null when the fetch fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useGithubStars());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(result.current).toBeNull();
    expect(logWarn).toHaveBeenCalled();
  });
});
