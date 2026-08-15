import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { useQueryParam } from "./use-query-param";

function wrapper(initial = "/?lang=en") {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>;
  };
}

describe("useQueryParam", () => {
  it("reads the current value from the URL", () => {
    const { result } = renderHook(() => useQueryParam("lang"), { wrapper: wrapper() });
    expect(result.current[0]).toBe("en");
  });

  it("returns null when the param is absent", () => {
    const { result } = renderHook(() => useQueryParam("missing"), { wrapper: wrapper() });
    expect(result.current[0]).toBeNull();
  });

  it("updates the param and re-reads it", () => {
    const { result } = renderHook(() => useQueryParam("lang"), { wrapper: wrapper() });
    act(() => result.current[1]("id"));
    expect(result.current[0]).toBe("id");
  });

  it("removes the param when set to null", () => {
    const { result } = renderHook(() => useQueryParam("lang"), { wrapper: wrapper() });
    act(() => result.current[1]("id"));
    act(() => result.current[1](null));
    expect(result.current[0]).toBeNull();
  });
});
