import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAsyncEffect } from "./use-async-effect";

describe("useAsyncEffect", () => {
  it("calls effect and isActive is true while mounted", async () => {
    const spy = vi.fn(async (isActive: () => boolean) => {
      expect(isActive()).toBe(true);
    });
    renderHook(({ deps }) => useAsyncEffect(spy, deps), { initialProps: { deps: [1] } });
    await waitFor(() => expect(spy).toHaveBeenCalledOnce());
  });

  it("flips isActive to false on unmount", async () => {
    let isActiveValue = true;
    const spy = vi.fn(async (isActive: () => boolean) => {
      await new Promise((r) => setTimeout(r, 10));
      isActiveValue = isActive();
    });
    const { unmount } = renderHook(({ deps }) => useAsyncEffect(spy, deps), {
      initialProps: { deps: [1] },
    });
    await waitFor(() => expect(spy).toHaveBeenCalledOnce());
    act(() => unmount());
    await waitFor(() => expect(isActiveValue).toBe(false));
  });

  it("re-runs on dep change", async () => {
    const spy = vi.fn(async () => {});
    const { rerender } = renderHook(({ deps }) => useAsyncEffect(spy, deps), {
      initialProps: { deps: [1] },
    });
    act(() => rerender({ deps: [2] }));
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
  });
});
