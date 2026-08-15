import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SplitPane } from "./split-pane";

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

function renderPane() {
  return render(
    <SplitPane storageKey="t">
      <SplitPane.Left>L</SplitPane.Left>
      <SplitPane.Right>R</SplitPane.Right>
    </SplitPane>,
  );
}

function drag(separator: HTMLElement, clientX: number) {
  fireEvent.pointerDown(separator, { pointerId: 1, clientX: 0 });
  fireEvent.pointerMove(separator, { pointerId: 1, clientX });
  fireEvent.pointerUp(separator, { pointerId: 1, clientX });
}

describe("SplitPane", () => {
  const storage = new MemoryStorage();

  beforeEach(() => {
    vi.clearAllMocks();
    storage.clear();
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    Element.prototype.setPointerCapture = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders both panes", () => {
    renderPane();

    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("R")).toBeInTheDocument();
  });

  it("drags the separator to resize the first pane", () => {
    renderPane();

    const separator = screen.getByRole("separator", { name: "Drag to resize" });
    const container = separator.parentElement as HTMLElement;
    const firstPane = container.firstElementChild as HTMLElement;

    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      width: 1000,
      height: 600,
      left: 0,
      top: 0,
      right: 1000,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    expect(firstPane.style.width).toBe("60%");

    drag(separator, 300);

    expect(firstPane.style.width).toBe("30%");
  });

  it("persists the ratio to localStorage after pointerup", () => {
    renderPane();

    const separator = screen.getByRole("separator", { name: "Drag to resize" });
    const container = separator.parentElement as HTMLElement;
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      width: 1000,
      height: 600,
      left: 0,
      top: 0,
      right: 1000,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    drag(separator, 300);

    expect(storage.getItem("t\u0000d")).toBe("0.3");
  });
});
