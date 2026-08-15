import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDecode } from "./use-decode";

const encoderState = { error: null as string | null };
const decode = vi.fn();
vi.mock("./use-encoder", () => ({
  useEncoder: () => ({ decode, error: encoderState.error }),
}));

describe("useDecode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    encoderState.error = null;
    vi.useFakeTimers();
  });

  it("debounces decode on input", async () => {
    decode.mockResolvedValue({ sizeBytes: 3 } as never);
    const { result } = renderHook(() => useDecode(100));
    act(() => result.current.setInput("aGk="));
    expect(decode).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    await act(async () => {});
    expect(decode).toHaveBeenCalledOnce();
    expect(result.current.pending).toBe(false);
    expect(result.current.result).toEqual({ sizeBytes: 3 });
  });

  it("clears result for empty input without calling decode", async () => {
    const { result } = renderHook(() => useDecode(100));
    act(() => result.current.setInput("  "));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(decode).not.toHaveBeenCalled();
    expect(result.current.result).toBeNull();
    expect(result.current.pending).toBe(false);
  });

  it("passes decompress option to decode", async () => {
    decode.mockResolvedValue({ sizeBytes: 3 } as never);
    const { result } = renderHook(() => useDecode(100));
    act(() => result.current.setDecompress("gzip"));
    act(() => result.current.setInput("aGk="));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    await act(async () => {});
    expect(decode).toHaveBeenCalledWith("aGk=", "gzip");
  });

  it("surfaces the encoder error when decode fails", async () => {
    decode.mockImplementation(async () => {
      encoderState.error = "bad base64";
      return null;
    });
    const { result } = renderHook(() => useDecode(100));
    act(() => result.current.setInput("###not-base64###"));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    await act(async () => {});
    expect(result.current.error).toBe("bad base64");
    expect(result.current.result).toBeNull();
    expect(result.current.pending).toBe(false);
  });
});
