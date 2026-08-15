import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Asset, CompressionRecord } from "@/lib/db";
import type { PreviewData } from "@/components/preview-panel";
import CompressionPage from "./compression-page";

const navigate = vi.fn();
const useParams = vi.fn(() => ({ assetId: "asset-1", compressionId: "comp-1" }));
const history = {
  ready: true,
  getAsset: vi.fn(),
  getCompression: vi.fn(),
};
const previewState = {
  preview: null as PreviewData | null,
  previewLoading: false,
  exportBase64: "aGVsbG8=" as string | null,
  base64Loading: false,
};

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate, useParams: () => useParams() };
});
vi.mock("@/providers/history-provider", () => ({ useHistory: () => history }));
vi.mock("@/hooks/use-preview", () => ({ usePreview: () => previewState }));
vi.mock("@/lib/analytics/track", () => ({ trackEvent: vi.fn() }));

const asset: Asset = {
  id: 1,
  uuid: "asset-1",
  name: "a.txt",
  mime: "text/plain",
  kind: "text",
  sizeBytes: 5,
  rawText: "hello",
  bytes: new TextEncoder().encode("hello"),
  createdAt: 1780000000000,
};

function compression(): CompressionRecord {
  return {
    uuid: "comp-1",
    assetId: "asset-1",
    name: "a.txt",
    mime: "text/plain",
    kind: "text",
    rawSizeBytes: 1000,
    rawBase64Length: 1360,
    rawText: "",
    variations: [{ algorithm: "gzip", quality: 70, byteLength: 400, base64Length: 544, ms: 5 }],
    createdAt: 1780000000000,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CompressionPage />
    </MemoryRouter>,
  );
}

describe("CompressionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    history.ready = true;
    history.getAsset.mockReturnValue(asset);
    history.getCompression.mockReturnValue(compression());
    previewState.preview = {
      bytes: new TextEncoder().encode("hello"),
      info: { kind: "text", mime: "text/plain", ext: "txt", label: "TXT" },
      sizeBytes: 5,
      text: "hello",
    };
    previewState.previewLoading = false;
    previewState.base64Loading = false;
    URL.createObjectURL = vi.fn(() => "blob:mock") as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;
  });

  it("shows a shimmer while history is loading", () => {
    history.ready = false;
    renderPage();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows not-found when the compression is missing", () => {
    history.getCompression.mockReturnValue(undefined);
    renderPage();
    expect(screen.getByText("Record not found.")).toBeInTheDocument();
  });

  it("renders the compression workspace with variations", () => {
    renderPage();
    expect(screen.getByText("Variations")).toBeInTheDocument();
    expect(screen.getByText("Gzip · 70% (30% reduced)")).toBeInTheDocument();
    expect(screen.getByText("Original")).toBeInTheDocument();
  });

  it("opens the fullscreen viewer and navigates between variations", async () => {
    const user = userEvent.setup();
    previewState.preview = {
      bytes: new Uint8Array([1, 2, 3]),
      info: { kind: "png", mime: "image/png", ext: "png", label: "PNG" },
      sizeBytes: 3,
      image: { width: 10, height: 10 },
    };
    renderPage();

    await user.click(screen.getByRole("button", { name: "Full screen" }));
    expect(screen.getByRole("button", { name: "Previous variation" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next variation" }));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("button", { name: "Previous variation" })).not.toBeInTheDocument();
  });
});
