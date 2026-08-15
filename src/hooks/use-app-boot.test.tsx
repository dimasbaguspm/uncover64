import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/worker-client", () => ({
  initWorker: vi.fn(async () => undefined),
}));
vi.mock("@/lib/analytics/track", () => ({
  trackEvent: vi.fn(),
}));
vi.mock("@/lib/analytics/otel", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));
vi.mock("@/constants/analytics", () => ({
  ANALYTICS: { otelUrl: "" },
}));

import { logInfo } from "@/lib/analytics/otel";
import { trackEvent } from "@/lib/analytics/track";
import { initWorker } from "@/lib/worker-client";
import { useAppBoot } from "./use-app-boot";

describe("useAppBoot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts not ready, then flips ready once boot finishes", async () => {
    const { result } = renderHook(() => useAppBoot());
    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
    expect(initWorker).toHaveBeenCalledOnce();
  });

  it("tracks page_loaded and logs boot info once ready", async () => {
    const { result } = renderHook(() => useAppBoot());
    await waitFor(() => expect(result.current).toBe(true));
    expect(trackEvent).toHaveBeenCalledWith("page_loaded");
    expect(logInfo).toHaveBeenCalledWith(
      "app booted",
      expect.objectContaining({ version: expect.any(String) }),
    );
  });
});
