import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePreview } from "./use-preview";

const getBase64 = vi.fn();
const decode = vi.fn();
vi.mock("./use-encoder", () => ({ useEncoder: () => ({ decode }) }));
vi.mock("@/providers/history-provider", () => ({
  useHistory: () => ({ getBase64 }),
}));

const compression = {
  uuid: "c1",
  variations: [{ algorithm: "gzip", quality: 50 }],
} as never;

describe("usePreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBase64.mockResolvedValue("aGk=");
    decode.mockResolvedValue({ bytes: new Uint8Array([1]), info: { mime: "text/plain" }, sizeBytes: 1, text: "hi" });
  });

  it("loads preview and export base64 for selected variation", async () => {
    const { result } = renderHook(() =>
      usePreview({
        compression,
        asset: {} as never,
        selectedId: "gzip:50",
        variations: [{ id: "gzip:50", algorithm: "gzip" }],
      }),
    );
    expect(result.current.previewLoading).toBe(true);
    await waitFor(() => expect(result.current.previewLoading).toBe(false));
    expect(result.current.preview?.text).toBe("hi");
    expect(result.current.exportBase64).toBe("aGk=");
  });

  it("is idle when compression is null", () => {
    const { result } = renderHook(() =>
      usePreview({ compression: null, asset: null, selectedId: "raw", variations: [] }),
    );
    expect(result.current.previewLoading).toBe(false);
    expect(result.current.preview).toBeNull();
  });
});
