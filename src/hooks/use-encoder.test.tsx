import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEncoder } from "./use-encoder";

const encodeAll = vi.fn();
const encodeSelected = vi.fn();
const decodeInput = vi.fn();
const downscaleImage = vi.fn();

vi.mock("@/lib/worker-client", () => ({
  encodeAll: (...a: unknown[]) => encodeAll(...a),
  encodeSelected: (...a: unknown[]) => encodeSelected(...a),
  decodeInput: (...a: unknown[]) => decodeInput(...a),
  downscaleImage: (...a: unknown[]) => downscaleImage(...a),
}));

describe("useEncoder", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exposes busy true while an op runs, false after", async () => {
    let resolve!: (v: unknown) => void;
    encodeAll.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { result } = renderHook(() => useEncoder());
    let promise!: Promise<unknown>;
    act(() => {
      promise = result.current.encodeAll(new ArrayBuffer(1));
    });
    expect(result.current.busy).toBe(true);
    await act(async () => {
      resolve({ ok: true });
      await promise;
    });
    expect(result.current.busy).toBe(false);
  });

  it("returns result on success", async () => {
    encodeAll.mockResolvedValue({ variations: [] });
    const { result } = renderHook(() => useEncoder());
    await act(async () => {
      const res = await result.current.encodeAll(new ArrayBuffer(1));
      expect(res).toEqual({ variations: [] });
    });
  });

  it("sets error and returns null on failure", async () => {
    encodeAll.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useEncoder());
    await act(async () => {
      const res = await result.current.encodeAll(new ArrayBuffer(1));
      expect(res).toBeNull();
    });
    expect(result.current.error).toBe("boom");
  });

  it("clearError resets error", async () => {
    encodeAll.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useEncoder());
    await act(async () => {
      await result.current.encodeAll(new ArrayBuffer(1));
    });
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
