import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EncodePage from "./encode";

const navigate = vi.fn();
const addAsset = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});
vi.mock("@/providers/history-provider", () => ({ useHistory: () => ({ addAsset }) }));
vi.mock("@/hooks/use-file-drop", () => ({ useFileDrop: () => false }));

function file(name = "hello.txt", content = "hello") {
  return new File([content], name, { type: "text/plain" });
}

describe("EncodePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the upload zone", () => {
    render(<EncodePage />);
    expect(screen.getByText("Drop a file to encode it as base64")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("saves the file as an asset and navigates to it", async () => {
    const user = userEvent.setup();
    addAsset.mockResolvedValue({ uuid: "asset-123" });
    render(<EncodePage />);

    const input = screen.getByRole("button").querySelector("input")!;
    await user.upload(input, file());

    expect(addAsset).toHaveBeenCalledWith(
      "hello.txt",
      expect.any(Uint8Array),
      expect.objectContaining({ kind: "text", mime: "text/plain" }),
    );
    await screen.findByText("Drop a file to encode it as base64");
    expect(navigate).toHaveBeenCalledWith("/encode/asset-123");
  });

  it("shows a spinner while the file is being processed", async () => {
    const user = userEvent.setup();
    addAsset.mockReturnValue(new Promise(() => {}));
    render(<EncodePage />);

    const input = screen.getByRole("button").querySelector("input")!;
    await user.upload(input, file());

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });
});
