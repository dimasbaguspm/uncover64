import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFileDrop } from "./use-file-drop";

function dragEvent(type: string, files?: File[]): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", {
    value: files ? { files } : {},
  });
  return event;
}

function fireDrag(type: string, files?: File[]) {
  window.dispatchEvent(dragEvent(type, files));
}

describe("useFileDrop", () => {
  it("toggles isDragging on dragenter and dragleave", () => {
    const { result } = renderHook(() => useFileDrop(vi.fn()));
    expect(result.current).toBe(false);
    act(() => fireDrag("dragenter"));
    expect(result.current).toBe(true);
    act(() => fireDrag("dragleave"));
    expect(result.current).toBe(false);
  });

  it("keeps isDragging true for nested dragenter/dragleave", () => {
    const { result } = renderHook(() => useFileDrop(vi.fn()));
    act(() => fireDrag("dragenter"));
    act(() => fireDrag("dragenter"));
    act(() => fireDrag("dragleave"));
    expect(result.current).toBe(true);
    act(() => fireDrag("dragleave"));
    expect(result.current).toBe(false);
  });

  it("passes the dropped file to onFile and resets isDragging", () => {
    const onFile = vi.fn();
    const file = new File(["x"], "a.txt", { type: "text/plain" });
    const { result } = renderHook(() => useFileDrop(onFile));
    act(() => fireDrag("dragenter"));
    act(() => fireDrag("drop", [file]));
    expect(onFile).toHaveBeenCalledWith(file);
    expect(result.current).toBe(false);
  });

  it("calls the latest onFile after a rerender", () => {
    const first = vi.fn();
    const second = vi.fn();
    const file = new File(["x"], "a.txt");
    const { rerender } = renderHook(({ handler }: { handler: (f: File) => void }) => useFileDrop(handler), {
      initialProps: { handler: first },
    });
    rerender({ handler: second });
    act(() => fireDrag("drop", [file]));
    expect(second).toHaveBeenCalledWith(file);
    expect(first).not.toHaveBeenCalled();
  });
});
