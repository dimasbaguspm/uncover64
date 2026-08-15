import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/i18n";
import { ResultActions } from "./result-actions";

const downloadBlob = vi.fn();

vi.mock("@/lib/utils/download", () => ({
  downloadBlob: (...args: unknown[]) => downloadBlob(...args),
}));

describe("ResultActions", () => {
  beforeEach(() => vi.clearAllMocks());

  const bytes = new Uint8Array([1, 2, 3]);

  function renderActions(props: Partial<React.ComponentProps<typeof ResultActions>> = {}) {
    return render(
      <ResultActions
        isJson={false}
        pretty={true}
        onTogglePretty={vi.fn()}
        text="abc"
        mime="text/plain"
        ext="txt"
        bytes={bytes}
        {...props}
      />,
    );
  }

  it("renders copy and download buttons", () => {
    renderActions();
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
  });

  it("calls downloadBlob with bytes, mime and decoded.<ext> on click", async () => {
    const user = userEvent.setup();
    renderActions();

    await user.click(screen.getByRole("button", { name: "Download" }));

    expect(downloadBlob).toHaveBeenCalledWith(bytes, "text/plain", "decoded.txt");
  });

  it("shows the pretty toggle only for json and fires onTogglePretty", async () => {
    const onTogglePretty = vi.fn();
    const user = userEvent.setup();
    const { rerender } = renderActions({ isJson: true, onTogglePretty });

    expect(screen.getByRole("button", { name: "Minify" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Minify" }));
    expect(onTogglePretty).toHaveBeenCalledTimes(1);

    rerender(
      <ResultActions
        isJson={true}
        pretty={false}
        onTogglePretty={onTogglePretty}
        text="{}"
        mime="application/json"
        ext="json"
        bytes={bytes}
      />,
    );
    expect(screen.getByRole("button", { name: "Pretty-print" })).toBeInTheDocument();
  });

  it("renders no toggle button for non-json", () => {
    renderActions();
    expect(screen.queryByRole("button", { name: /minify|pretty-print/i })).not.toBeInTheDocument();
  });
});
