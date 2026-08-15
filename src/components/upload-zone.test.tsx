import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UploadZone } from "./upload-zone";

describe("UploadZone", () => {
  it("renders the title and hint text", () => {
    render(<UploadZone title="Drop a file" onFile={vi.fn()} />);
    expect(screen.getByText("Drop a file")).toBeInTheDocument();
    expect(screen.getByText(/processed locally/i)).toBeInTheDocument();
  });

  it("opens the file dialog when clicked", async () => {
    const user = userEvent.setup();
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    render(<UploadZone title="Drop a file" onFile={vi.fn()} />);

    await user.click(screen.getByText("Drop a file"));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it("forwards the selected file and resets the input", async () => {
    const user = userEvent.setup();
    const onFile = vi.fn();
    render(<UploadZone title="Drop a file" onFile={onFile} />);

    const file = new File(["hello"], "hello.txt", { type: "text/plain" });
    const input = screen.getByRole("button").querySelector("input")!;
    await user.upload(input, file);
    expect(onFile).toHaveBeenCalledWith(file);
    expect(input.value).toBe("");
  });
});
