import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Asset } from "@/lib/db";
import type { EncodeAllResult } from "@/lib/types";
import { useHistory } from "@/providers/history-provider";
import { useEncoder } from "@/hooks/use-encoder";
import AssetPage from "./asset-page";

const navigate = vi.fn();
const useParams = vi.fn(() => ({ assetId: "asset-1" }));
const history = {
  ready: true,
  getAsset: vi.fn(),
  compressionsForAsset: vi.fn(() => []),
  addCompression: vi.fn(),
};
const encoder = { encodeSelected: vi.fn(), busy: false, error: null as string | null };

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate, useParams: () => useParams() };
});
vi.mock("@/providers/history-provider", () => ({ useHistory: () => history }));
vi.mock("@/hooks/use-encoder", () => ({ useEncoder: () => encoder }));
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

function encodeResult(): EncodeAllResult {
  return {
    base64: "aGVsbG8=",
    mime: "text/plain",
    kind: "text",
    rawSizeBytes: 5,
    rawBase64Length: 8,
    variations: [],
    ms: 5,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AssetPage />
    </MemoryRouter>,
  );
}

describe("AssetPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    history.ready = true;
    history.getAsset.mockReturnValue(asset);
    encoder.busy = false;
    encoder.error = null;
    URL.createObjectURL = vi.fn(() => "blob:mock") as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;
  });

  it("shows a shimmer while history is loading", () => {
    history.ready = false;
    renderPage();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows not-found for an unknown asset", () => {
    history.getAsset.mockReturnValue(undefined);
    renderPage();
    expect(screen.getByText("Record not found.")).toBeInTheDocument();
  });

  it("renders the asset and its algorithms", () => {
    renderPage();
    expect(screen.getByText("a.txt")).toBeInTheDocument();
    expect(screen.getByText("Gzip")).toBeInTheDocument();
    expect(screen.getAllByText("LZ-String").length).toBeGreaterThan(0);
  });

  it("selects all and proceeds to encoding", async () => {
    const user = userEvent.setup();
    encoder.encodeSelected.mockResolvedValue(encodeResult());
    history.addCompression.mockResolvedValue({ uuid: "comp-1" });
    renderPage();

    await user.click(screen.getByText("Select all"));
    expect(screen.getByRole("button", { name: /Proceed · \d+/ })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: /Proceed · \d+/ }));
    expect(encoder.encodeSelected).toHaveBeenCalledTimes(1);
    expect(history.addCompression).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/encode/asset-1/compress/comp-1");
  });

  it("disables proceed with no selection", async () => {
    const user = userEvent.setup();
    renderPage();
    const proceed = screen.getByRole("button", { name: /Proceed · 0/ });
    expect(proceed).toBeDisabled();
    await user.click(proceed);
    expect(encoder.encodeSelected).not.toHaveBeenCalled();
  });
});
