import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FileInfo } from "@/lib/types";
import { Badge, CodeBlock, CopyButton, ErrorBanner, Shimmer, Spinner, btn, btnActive, btnPrimary, inputCls } from "./ui";

function info(overrides: Partial<FileInfo> = {}): FileInfo {
  return {
    kind: "text",
    mime: "text/plain",
    ext: "txt",
    label: "TXT",
    ...overrides,
  };
}

describe("Badge", () => {
  it("renders the label and kind-tinted class", () => {
    const { container } = render(<Badge info={info({ kind: "binary" })} />);
    expect(screen.getByText("TXT")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("bg-[var(--tint-rose-bg)]");
  });

  it("shows the extension for non-text kinds", () => {
    render(<Badge info={info({ kind: "png", ext: "png" })} />);
    expect(screen.getByText("· png")).toBeInTheDocument();
  });

  it("hides the extension for text/json/jwt kinds", () => {
    render(<Badge info={info({ kind: "json", ext: "json" })} />);
    expect(screen.queryByText("· json")).not.toBeInTheDocument();
  });
});

describe("ErrorBanner", () => {
  it("renders nothing for an empty message", () => {
    const { container } = render(<ErrorBanner message="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the message in an alert", () => {
    render(<ErrorBanner message="boom" />);
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
  });
});

describe("CodeBlock", () => {
  it("renders the code and the label", () => {
    render(<CodeBlock code="aGk=" label="Payload" />);
    expect(screen.getByText("Payload")).toBeInTheDocument();
    expect(screen.getByText("aGk=")).toBeInTheDocument();
  });

  it("renders without a label when omitted", () => {
    render(<CodeBlock code="aGk=" />);
    expect(screen.getByText("aGk=")).toBeInTheDocument();
  });

  it("copies the code via the copy button", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });

    render(<CodeBlock code="secret-value" label="Payload" />);
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("secret-value");
  });
});

describe("CopyButton", () => {
  it("copies the value and shows the copied state", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });

    render(<CopyButton value="hello" label="Copy hello" />);
    await user.click(screen.getByRole("button", { name: "Copy hello" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello");
    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
  });
});

describe("Spinner + Shimmer", () => {
  it("renders the spinner", () => {
    render(<Spinner />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders the shimmer with an extra class", () => {
    render(<Shimmer className="h-10" />);
    expect(document.querySelector(".animate-pulse")).toHaveClass("h-10");
  });
});

describe("exported class strings", () => {
  it("keeps button and input class tokens intact", () => {
    expect(btn).toContain("inline-flex");
    expect(btnPrimary).toContain("bg-accent");
    expect(btnActive).toContain("text-accent");
    expect(inputCls).toContain("rounded-lg");
  });
});
