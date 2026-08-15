import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@/i18n";
import type { VariationOption } from "./record-detail";
import { VariationRow } from "./variation-row";

function fixture(): VariationOption {
  return {
    id: "gzip:70",
    label: "Gzip · 70% (30% reduced)",
    algorithm: "gzip",
    quality: 70,
    byteLength: 400,
    base64Length: 544,
    ms: 5,
  };
}

function renderRow(overrides: Partial<React.ComponentProps<typeof VariationRow>> = {}) {
  const onSelect = vi.fn();
  const onDownload = vi.fn();
  const utils = render(
    <VariationRow
      variation={fixture()}
      selected={false}
      recommended={false}
      onSelect={onSelect}
      base64={null}
      base64Loading={false}
      originalSize={1000}
      onDownload={onDownload}
      {...overrides}
    />,
  );
  return { onSelect, onDownload, ...utils };
}

describe("VariationRow", () => {
  it("renders the variation label, size, char count and size line", () => {
    renderRow();
    expect(screen.getByText("Gzip · 70% (30% reduced)")).toBeInTheDocument();
    expect(screen.getByText("400 B")).toBeInTheDocument();
    expect(screen.getByText("544 chars")).toBeInTheDocument();
    expect(screen.getByText(/Original: 1000 B/)).toBeInTheDocument();
    expect(screen.getByText(/· 5ms/)).toBeInTheDocument();
  });

  it("marks the recommended row", () => {
    renderRow({ recommended: true });
    expect(screen.getByText("★ Recommended")).toBeInTheDocument();
  });

  it("fires onSelect with the variation id on click", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderRow();
    await user.click(screen.getByText("Gzip · 70% (30% reduced)"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("gzip:70");
  });

  it("shows copy/download actions only when selected with base64 loaded", async () => {
    const user = userEvent.setup();
    const { onDownload } = renderRow({ selected: true, base64: "aGVsbG8=" });

    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Download" }));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("omits actions while base64 is loading", () => {
    renderRow({ selected: true, base64: null, base64Loading: true });
    expect(screen.queryByRole("button", { name: "Download" })).not.toBeInTheDocument();
  });
});
