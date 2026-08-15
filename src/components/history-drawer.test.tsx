import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Asset } from "@/lib/db";
import { HistoryDrawer } from "./history-drawer";

const useHistoryMock = vi.fn();
vi.mock("@/providers/history-provider", () => ({ useHistory: () => useHistoryMock() }));
vi.mock("@/lib/analytics/track", () => ({ trackEvent: vi.fn() }));

function asset(name: string, mime: string): Asset {
  return {
    uuid: `uuid-${name}`,
    name,
    mime,
    kind: "text",
    sizeBytes: 10,
    rawText: "hello",
    bytes: new Uint8Array(0),
    createdAt: 1780000000000,
  };
}

function renderDrawer(overrides: { open?: boolean; onClose?: () => void } = {}) {
  const onClose = overrides.onClose ?? vi.fn();
  const open = overrides.open ?? true;
  const utils = render(
    <MemoryRouter>
      <HistoryDrawer open={open} onClose={onClose} />
    </MemoryRouter>,
  );
  return { onClose, ...utils };
}

beforeEach(() => {
  useHistoryMock.mockReturnValue({
    assets: [asset("a.txt", "text/plain"), asset("b.png", "image/png")],
    removeAsset: vi.fn(),
    clear: vi.fn(),
  });
});

describe("HistoryDrawer", () => {
  it("renders nothing when closed", () => {
    const { container } = renderDrawer({ open: false });
    expect(container.firstChild).toBeNull();
  });

  it("lists the saved assets", () => {
    renderDrawer();
    expect(screen.getByText("a.txt")).toBeInTheDocument();
    expect(screen.getByText("b.png")).toBeInTheDocument();
  });

  it("filters assets by name and mime", async () => {
    const user = userEvent.setup();
    renderDrawer();
    await user.type(screen.getByPlaceholderText("Search history…"), "b.png");
    expect(screen.getByText("b.png")).toBeInTheDocument();
    expect(screen.queryByText("a.txt")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no assets", () => {
    useHistoryMock.mockReturnValue({
      assets: [],
      removeAsset: vi.fn(),
      clear: vi.fn(),
    });
    renderDrawer();
    expect(screen.getByText("No saved records yet.")).toBeInTheDocument();
  });

  it("clears all history", async () => {
    const user = userEvent.setup();
    const { clear } = useHistoryMock();
    renderDrawer();
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("calls onClose from the close button and the backdrop", async () => {
    const user = userEvent.setup();
    const { onClose } = renderDrawer();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
