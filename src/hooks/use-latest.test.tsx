// src/hooks/use-latest.test.tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLatest } from "./use-latest";

describe("useLatest", () => {
  it("returns current value synchronously", () => {
    const { result, rerender } = renderHook((v: number) => useLatest(v), { initialProps: 1 });
    expect(result.current.current).toBe(1);
    act(() => rerender(2));
    expect(result.current.current).toBe(2);
  });
});
