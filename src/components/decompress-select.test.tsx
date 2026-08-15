import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@/i18n";
import { DecompressSelect } from "./decompress-select";

describe("DecompressSelect", () => {
  it("renders every decompress option with its label", () => {
    render(<DecompressSelect value="auto" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Decompress after decoding")).toHaveValue("auto");
    expect(screen.getByRole("option", { name: "Auto" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Gzip" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Deflate-raw" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Off" })).toBeInTheDocument();
  });

  it("fires onChange with the selected option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DecompressSelect value={null} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText("Decompress after decoding"), "brotli");
    expect(onChange).toHaveBeenCalledWith("brotli");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("matches the null (off) option by its string form", () => {
    render(<DecompressSelect value={null} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Decompress after decoding")).toHaveValue("null");
  });
});
