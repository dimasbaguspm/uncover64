import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CompressionRecord } from "@/lib/db";
import { CompressionHistoryRow } from "./compression-history-row";

const createdAt = 1780000000000;
const compressedAt = () => new Date(createdAt).toLocaleString();

function fixture(): CompressionRecord {
  return {
    uuid: "comp-1",
    assetId: "asset-1",
    name: "sample.txt",
    mime: "text/plain",
    kind: "text",
    rawSizeBytes: 100,
    rawBase64Length: 136,
    rawText: "",
    variations: [
      { algorithm: "gzip", quality: 70, byteLength: 40, base64Length: 56, ms: 5 },
      { algorithm: "brotli", quality: 70, byteLength: 32, base64Length: 44, ms: 7 },
    ],
    createdAt,
  };
}

describe("CompressionHistoryRow", () => {
  it("renders variation count and formatted date", () => {
    render(<CompressionHistoryRow compression={fixture()} onClick={vi.fn()} />);
    expect(screen.getByText(`2 ${"variations"}`)).toBeInTheDocument();
    expect(screen.getByText(compressedAt())).toBeInTheDocument();
  });

  it("fires onClick when pressed", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CompressionHistoryRow compression={fixture()} onClick={onClick} />);

    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
