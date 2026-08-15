import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@/i18n";
import { MaxWidthSelect } from "./max-width-select";

describe("MaxWidthSelect", () => {
  it("renders a labeled select with all preset widths", () => {
    render(<MaxWidthSelect value={1024} onChange={vi.fn()} />);
    const select = screen.getByLabelText("Max width");
    expect(select).toHaveValue("1024");
    expect(screen.getByRole("option", { name: "256px" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "3840px" })).toBeInTheDocument();
  });

  it("fires onChange with the numeric width", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MaxWidthSelect value={256} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText("Max width"), "1920");
    expect(onChange).toHaveBeenCalledWith(1920);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
