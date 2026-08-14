import { describe, expect, it } from "vitest";
import { detect } from "./detect";
import { utf8Encode } from "./base64";

const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0,
]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const GZIP = new Uint8Array([0x1f, 0x8b, 0x08, 0x00, 0, 0, 0, 0]);
const ZIP = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
const GIF = utf8Encode("GIF89a");
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const WASM = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
const EBML_WEBM = new Uint8Array([
  0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0x77, 0x65, 0x62, 0x6d,
]);
const EBML_MKV = new Uint8Array([
  0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0x6d, 0x61, 0x74, 0x72, 0x6f, 0x73, 0x6b, 0x61,
]);
const MP4 = new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]);
const MP3 = new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00]);

describe("detect", () => {
  it.each([
    [PNG, "png"],
    [JPEG, "jpeg"],
    [PDF, "pdf"],
    [GZIP, "gzip"],
    [ZIP, "zip"],
    [GIF, "gif"],
    [WEBP, "webp"],
    [WASM, "wasm"],
  ])("detects magic bytes", (bytes, kind) => {
    expect(detect(bytes).kind).toBe(kind);
  });

  it("distinguishes webm from mkv by EBML doc type", () => {
    expect(detect(EBML_WEBM)).toMatchObject({ kind: "webm", mime: "video/webm" });
    expect(detect(EBML_MKV)).toMatchObject({ kind: "mkv", mime: "video/x-matroska" });
  });

  it("detects mp4 and mp3", () => {
    expect(detect(MP4)).toMatchObject({ kind: "mp4", mime: "video/mp4" });
    expect(detect(MP3)).toMatchObject({ kind: "mp3", mime: "audio/mpeg" });
  });

  it("detects JSON", () => {
    expect(detect(utf8Encode('{"a":1}')).kind).toBe("json");
    expect(detect(utf8Encode("  [1,2,3]")).kind).toBe("json");
  });

  it("detects plain text", () => {
    expect(detect(utf8Encode("just some text")).kind).toBe("text");
  });

  it("detects binary for non-utf8 bytes", () => {
    expect(detect(new Uint8Array([0x00, 0x01, 0x02, 0x03, 0xff, 0xfe, 0xfd]))).toMatchObject({
      kind: "binary",
    });
  });

  it("detects empty payload", () => {
    expect(detect(new Uint8Array(0)).kind).toBe("empty");
  });
});
