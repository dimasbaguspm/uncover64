import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/i18n";
import { IMAGE_DEFAULTS } from "@/constants/image";
import { ImageOptimizer } from "./image-optimizer";

const downscale = vi.fn();

vi.mock("@/hooks/use-encoder", () => ({
  useEncoder: () => ({
    busy: false,
    error: null,
    downscale: (...args: unknown[]) => downscale(...args),
  }),
}));

describe("ImageOptimizer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  const bytes = new Uint8Array([137, 80, 78, 71]);
  const originalDims = { width: 640, height: 480 };

  function renderOptimizer() {
    return render(
      <ImageOptimizer
        bytes={bytes}
        mime="image/png"
        originalSize={1234}
        originalDims={originalDims}
      />,
    );
  }

  it("renders the width select and re-encode button", () => {
    renderOptimizer();
    expect(screen.getByLabelText("Max width")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Re-encode" })).toBeInTheDocument();
  });

  it("calls downscale with buffer, mime and default options on click", async () => {
    downscale.mockResolvedValue(null);
    const user = userEvent.setup();
    renderOptimizer();

    await user.click(screen.getByRole("button", { name: "Re-encode" }));

    expect(downscale).toHaveBeenCalledTimes(1);
    const [buf, mime, opts] = downscale.mock.calls[0];
    expect(buf).toBeInstanceOf(ArrayBuffer);
    expect(mime).toBe("image/png");
    expect(opts).toEqual(IMAGE_DEFAULTS);
  });

  it("renders the optimized result with ExportBar after downscale resolves", async () => {
    downscale.mockResolvedValue({
      bytes: new Uint8Array([1, 2]),
      mime: "image/webp",
      width: 320,
      height: 240,
      base64: "AQI=",
      ms: 5,
    });
    const user = userEvent.setup();
    renderOptimizer();

    await user.click(screen.getByRole("button", { name: "Re-encode" }));

    expect(await screen.findByText("Output")).toBeInTheDocument();
    expect(screen.getByAltText("Optimized preview")).toBeInTheDocument();
  });
});
