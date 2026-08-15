// src/lib/utils/download.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { createObjectUrl, downloadBase64, downloadBlob, revokeObjectUrl } from "./download";

describe("download", () => {
  afterEach(() => vi.restoreAllMocks());

  it("downloadBlob anchors and clicks a blob URL", () => {
    const anchor = { click: vi.fn() };
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockReturnValue(anchor as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, "appendChild").mockReturnValue({} as never);
    vi.spyOn(document.body, "removeChild").mockReturnValue({} as never);

    downloadBlob(new Blob(["hi"]), "a.bin");

    expect(create).toHaveBeenCalledOnce();
    expect(anchor.click).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith("blob:x");
  });

  it("createObjectUrl builds a blob with mime", () => {
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:y");
    const url = createObjectUrl(new Uint8Array([1, 2]), "image/png");
    expect(url).toBe("blob:y");
    expect(create.mock.calls[0][0].type).toBe("image/png");
  });

  it("revokeObjectUrl calls URL.revokeObjectURL", () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    revokeObjectUrl("blob:z");
    expect(revoke).toHaveBeenCalledWith("blob:z");
  });

  it("downloadBase64 uses data uri", () => {
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:d");
    vi.spyOn(document, "createElement").mockReturnValue({ click: vi.fn() } as never);
    vi.spyOn(document.body, "appendChild").mockReturnValue({} as never);
    vi.spyOn(document.body, "removeChild").mockReturnValue({} as never);
    downloadBase64("aGVsbG8=", "text/plain", "x.txt");
    expect(create).toHaveBeenCalledOnce();
  });
});
