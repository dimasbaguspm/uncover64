import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useObjectUrl } from "./use-object-url";

describe("useObjectUrl", () => {
  it("creates an object URL and revokes on unmount", () => {
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const bytes = new Uint8Array([1, 2, 3]);
    const { result, unmount } = renderHook(() => useObjectUrl(bytes, "image/png"));
    expect(result.current).toBe("blob:x");
    act(() => unmount());
    expect(revoke).toHaveBeenCalledWith("blob:x");
  });

  it("returns null for null bytes and revokes previous URL", () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const create = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValueOnce("blob:a")
      .mockReturnValueOnce("blob:b");
    const { result, rerender } = renderHook(
      ({ b, m }) => useObjectUrl(b, m),
      { initialProps: { b: new Uint8Array([1]), m: "text/plain" } },
    );
    expect(result.current).toBe("blob:a");
    act(() => rerender({ b: new Uint8Array([2]), m: "text/plain" }));
    expect(revoke).toHaveBeenCalledWith("blob:a");
    expect(result.current).toBe("blob:b");
    act(() => rerender({ b: null, m: "text/plain" }));
    expect(result.current).toBeNull();
  });
});
