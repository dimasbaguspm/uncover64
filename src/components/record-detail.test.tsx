import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import type { CompressionRecord } from "@/lib/db";
import { RecordDetail, recordVariations } from "./record-detail";

const t = i18n.getFixedT("en");

function fixture(): CompressionRecord {
  return {
    uuid: "comp-1",
    assetId: "asset-1",
    name: "sample.txt",
    mime: "text/plain",
    kind: "text",
    rawSizeBytes: 1000,
    rawBase64Length: 1360,
    rawText: "",
    variations: [
      { algorithm: "gzip", quality: 70, byteLength: 400, base64Length: 544, ms: 5 },
      { algorithm: "gzip", quality: 30, byteLength: 200, base64Length: 272, ms: 3 },
    ],
    createdAt: 1780000000000,
  };
}

function renderDetail() {
  const onSelect = vi.fn();
  render(
    <RecordDetail
      record={fixture()}
      selectedId="raw"
      onSelect={onSelect}
      base64={null}
      base64Loading={false}
    />,
  );
  return { onSelect };
}

describe("recordVariations", () => {
  it("builds a raw row plus one row per variation", () => {
    const rows = recordVariations(fixture(), t);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ id: "raw", algorithm: null, quality: 100, byteLength: 1000 });
    expect(rows[1]).toMatchObject({ id: "gzip:70", algorithm: "gzip", quality: 70 });
    expect(rows[2]).toMatchObject({ id: "gzip:30", algorithm: "gzip", quality: 30 });
  });
});

describe("RecordDetail", () => {
  it("renders rows sorted by size ascending by default", () => {
    renderDetail();
    const buttons = screen.getAllByRole("button").slice(1);
    expect(buttons[0]).toHaveTextContent("Gzip · 30%");
    expect(buttons[1]).toHaveTextContent("Gzip · 70%");
    expect(buttons[2]).toHaveTextContent("Original");
  });

  it("marks the smallest compressed variation as recommended", () => {
    renderDetail();
    const recommended = screen.getByText("★ Recommended");
    expect(recommended.closest("button")).toHaveTextContent("Gzip · 30%");
  });

  it("sorts by quality when requested", () => {
    renderDetail();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "quality" } });
    const buttons = screen.getAllByRole("button").slice(1);
    expect(buttons[0]).toHaveTextContent("Gzip · 30%");
    expect(buttons[1]).toHaveTextContent("Gzip · 70%");
    expect(buttons[2]).toHaveTextContent("Original");
  });

  it("reverses the sort order with the direction toggle", () => {
    renderDetail();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "quality" } });
    fireEvent.click(screen.getByRole("button", { name: "Toggle sort direction" }));
    const buttons = screen.getAllByRole("button").slice(1);
    expect(buttons[0]).toHaveTextContent("Original");
    expect(buttons[1]).toHaveTextContent("Gzip · 70%");
    expect(buttons[2]).toHaveTextContent("Gzip · 30%");
  });

  it("fires onSelect with the clicked variation id", () => {
    const { onSelect } = renderDetail();
    fireEvent.click(screen.getByText("Gzip · 30% (70% reduced)"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "gzip:30" }));
  });
});
