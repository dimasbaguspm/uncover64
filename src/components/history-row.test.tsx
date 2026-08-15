import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Asset } from "@/lib/db";
import { HistoryRow } from "./history-row";

const createdAt = 1780000000000;
const createdAtLine = new Date(createdAt).toLocaleString();

function fixture(): Asset {
  return {
    id: 1,
    uuid: "asset-1",
    name: "sample.txt",
    mime: "text/plain",
    kind: "text",
    sizeBytes: 1024,
    rawText: "hello",
    bytes: new TextEncoder().encode("hello"),
    createdAt,
  };
}

describe("HistoryRow", () => {
  it("renders the asset name, size and timestamp", () => {
    render(<HistoryRow entry={fixture()} onOpen={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("sample.txt")).toBeInTheDocument();
    expect(screen.getByText(`1.0 KB · ${createdAtLine}`)).toBeInTheDocument();
  });

  it("fires onOpen when the main area is clicked", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<HistoryRow entry={fixture()} onOpen={onOpen} onDelete={vi.fn()} />);

    await user.click(screen.getByText("sample.txt"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("fires onDelete when the delete button is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<HistoryRow entry={fixture()} onOpen={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
