import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@/i18n";
import { ExportFormatList } from "./export-format-list";

describe("ExportFormatList", () => {
  it("renders one button per export format", () => {
    render(<ExportFormatList value="raw" onChange={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });

  it("fires onChange with the clicked format id", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ExportFormatList value="raw" onChange={onChange} />);

    await user.click(screen.getAllByRole("button")[3]);
    expect(onChange).toHaveBeenCalledWith("k8s");
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
