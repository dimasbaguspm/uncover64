import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DecodeResult } from "@/lib/types";
import { ResultView } from "./result-view";

vi.mock("@/hooks/use-encoder", () => ({ useEncoder: () => ({ downscale: vi.fn() }) }));

function result(overrides: Partial<DecodeResult> = {}): DecodeResult {
  return {
    input: "aGVsbG8=",
    bytes: new TextEncoder().encode("hello"),
    sizeBytes: 5,
    info: { kind: "text", mime: "text/plain", ext: "txt", label: "TXT" },
    isUtf8: true,
    text: "hello",
    ms: 1,
    ...overrides,
  };
}

describe("ResultView", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:mock") as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;
  });

  it("renders the decoded text for a utf8 payload", () => {
    render(<ResultView result={result()} />);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders jwt header and payload blocks", () => {
    render(
      <ResultView
        result={result({
          info: { kind: "jwt", mime: "text/plain", ext: "jwt", label: "JWT" },
          jwt: { header: "eyJhbGci", payload: "eyJzdWIiLCJhIjoiMSJ9" },
        })}
      />,
    );
    expect(screen.getByText("Header (base64url-decoded)")).toBeInTheDocument();
    expect(screen.getByText("Payload (base64url-decoded)")).toBeInTheDocument();
    expect(screen.getByText("eyJhbGci")).toBeInTheDocument();
  });

  it("prettifies and minifies JSON", async () => {
    const user = userEvent.setup();
    render(
      <ResultView
        result={result({
          info: { kind: "json", mime: "application/json", ext: "json", label: "JSON" },
          text: '{"a":1}',
        })}
      />,
    );
    const textarea = screen.getByDisplayValue(/"a": 1/);
    expect(textarea).toHaveValue('{\n  "a": 1\n}');

    await user.click(screen.getByRole("button", { name: "Minify" }));
    expect(screen.getByDisplayValue('{"a":1}')).toBeInTheDocument();
  });

  it("shows the download button for a binary payload", () => {
    render(
      <ResultView
        result={result({
          info: { kind: "zip", mime: "application/zip", ext: "zip", label: "ZIP" },
          isUtf8: false,
        })}
      />,
    );
    expect(screen.getByText(/Binary payload/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download file" })).toBeInTheDocument();
  });

  it("renders an image preview and the optimizer when downscaling", () => {
    render(
      <ResultView
        showDownscale
        result={result({
          info: { kind: "png", mime: "image/png", ext: "png", label: "PNG" },
          isUtf8: false,
          image: { width: 100, height: 50 },
        })}
      />,
    );
    expect(screen.getByAltText("Decoded image preview")).toHaveAttribute("src", "blob:mock");
    expect(screen.getByRole("button", { name: "Re-encode" })).toBeInTheDocument();
  });

  it("shows the empty-payload message", () => {
    render(
      <ResultView
        result={result({ info: { kind: "empty", mime: "", ext: "", label: "Empty" } })}
      />,
    );
    expect(screen.getByText("Decoded payload is empty.")).toBeInTheDocument();
  });
});
