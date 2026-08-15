import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QualityOption } from "./quality-option";

describe("QualityOption", () => {
  it("renders the quality label and reduction hint", () => {
    render(<QualityOption algo="gzip" quality={70} selected={false} onChange={vi.fn()} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText("70%")).toBeInTheDocument();
    expect(screen.getByText("30% reduced")).toBeInTheDocument();
  });

  it("reflects the selected state", () => {
    render(<QualityOption algo="brotli" quality={50} selected onChange={vi.fn()} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("fires onChange with the algo:quality key on toggle", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QualityOption algo="deflate" quality={20} selected={false} onChange={onChange} />);

    await user.click(screen.getByText("20%"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("deflate:20");
  });
});
