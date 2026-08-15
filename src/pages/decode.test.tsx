import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DecodeResult } from "@/lib/types";
import DecodePage from "./decode";

const decode = {
  input: "",
  decompress: "auto" as const,
  result: null as DecodeResult | null,
  pending: false,
  error: null as string | null,
  setInput: vi.fn((v: string) => {
    decode.input = v;
  }),
  setDecompress: vi.fn(),
};

vi.mock("@/hooks/use-decode", () => ({ useDecode: () => decode }));

function decodeResult(): DecodeResult {
  return {
    input: "aGVsbG8=",
    bytes: new TextEncoder().encode("hello"),
    sizeBytes: 5,
    info: { kind: "text", mime: "text/plain", ext: "txt", label: "TXT" },
    isUtf8: true,
    text: "hello world",
    ms: 1,
  };
}

describe("DecodePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    decode.input = "";
    decode.result = null;
    decode.pending = false;
    decode.error = null;
    URL.createObjectURL = vi.fn(() => "blob:mock") as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;
  });

  it("shows the live hint and forwards typing to the hook", async () => {
    const user = userEvent.setup();
    render(<DecodePage />);
    expect(screen.getByText("Start typing to preview the decoded payload.")).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Paste base64, a data URI, or a JWT/);
    await user.type(textarea, "aGk=");
    expect(decode.setInput).toHaveBeenCalledWith("a");
  });

  it("pastes from the clipboard into the input", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", { clipboard: { readText: vi.fn().mockResolvedValue("aGVsbG8=") } });
    render(<DecodePage />);

    await user.click(screen.getByRole("button", { name: "Paste from clipboard" }));
    expect(decode.setInput).toHaveBeenCalledWith("aGVsbG8=");
  });

  it("reads a pasted file and uses its text as input", async () => {
    render(<DecodePage />);
    const file = new File(["payload"], "p.txt", { type: "text/plain" });
    const textarea = screen.getByPlaceholderText(/Paste base64, a data URI, or a JWT/);
    const ev = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(ev, "clipboardData", { value: { files: [file] } });
    fireEvent(textarea, ev);
    await screen.findByText("Start typing to preview the decoded payload.");
    expect(decode.setInput).toHaveBeenCalledWith("payload");
  });

  it("shows the decode error banner", () => {
    decode.error = "boom";
    render(<DecodePage />);
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
  });

  it("renders shimmer placeholders while decoding", () => {
    decode.pending = true;
    render(<DecodePage />);
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders the decoded result", () => {
    decode.result = decodeResult();
    render(<DecodePage />);
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });
});
