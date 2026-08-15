import { afterEach, describe, expect, it, vi } from "vitest";
import { compressBytes, opDecode, opDownscale } from "./ops";
import { QUALITY_ORIGINAL } from "@/constants/compression";
import { bytesToBase64, bytesToBase64Url, utf8Encode } from "@/lib/base64";

vi.mock("brotli-wasm", async () => {
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const nodePkg = require("brotli-wasm");
  return { default: Promise.resolve(nodePkg) };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("compressBytes", () => {
  it("compresses with lz regardless of the quality value", async () => {
    const text = "lz quality ".repeat(200);
    const raw = utf8Encode(text);
    const compressed = await compressBytes(raw, "lz", QUALITY_ORIGINAL);
    expect(compressed.byteLength).toBeLessThan(raw.byteLength);
    const decoded = await opDecode(bytesToBase64(compressed), "lz");
    expect(decoded.text).toBe(text);
  });
});

describe("opDecode", () => {
  it("leaves plain text untouched under auto detection", async () => {
    const decoded = await opDecode(bytesToBase64(utf8Encode('{"hello":"world"}')), "auto");
    expect(decoded.decompressed).toBeUndefined();
    expect(decoded.info.kind).toBe("json");
  });

  it("rejects invalid base64", async () => {
    await expect(opDecode("!!!not base64!!!")).rejects.toThrow();
  });

  it("strips data URI prefix", async () => {
    const res = await opDecode("data:text/plain;base64,aGVsbG8=");
    expect(res.text).toBe("hello");
  });

  it("detects JWT and parses segments", async () => {
    const header = bytesToBase64Url(utf8Encode('{"alg":"HS256","typ":"JWT"}'));
    const payload = bytesToBase64Url(utf8Encode('{"sub":"1234567890"}'));
    const token = `${header}.${payload}.signature`;
    const decoded = await opDecode(token);
    expect(decoded.info.kind).toBe("jwt");
    expect(JSON.parse(decoded.jwt!.header)).toEqual({ alg: "HS256", typ: "JWT" });
    expect(JSON.parse(decoded.jwt!.payload)).toEqual({ sub: "1234567890" });
  });

  it("detects JSON and pretty-prints source text", async () => {
    const res = await opDecode(bytesToBase64(utf8Encode('{"a":1}')));
    expect(res.info.kind).toBe("json");
    expect(res.text).toBe('{"a":1}');
  });
});

describe("opDownscale", () => {
  it("downscales an image via OffscreenCanvas", async () => {
    const bmp = { width: 400, height: 200, close: vi.fn() };
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      convertToBlob: vi.fn(
        async () => new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/webp" }),
      ),
    };
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => bmp),
    );
    vi.stubGlobal(
      "OffscreenCanvas",
      vi.fn(function (w: number, h: number) {
        canvas.width = w;
        canvas.height = h;
        return canvas;
      }),
    );

    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    const res = await opDownscale(bytes, "image/jpeg", {
      maxWidth: 200,
      quality: 0.8,
      format: "webp",
    });
    expect(res.width).toBe(200);
    expect(res.height).toBe(100);
    expect(res.mime).toBe("image/webp");
    expect(res.bytes.byteLength).toBe(4);
    expect(res.base64).toBe(Buffer.from([1, 2, 3, 4]).toString("base64"));
  });

  it("throws when OffscreenCanvas is unavailable", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ width: 10, height: 10, close: vi.fn() })),
    );
    vi.stubGlobal("OffscreenCanvas", undefined);
    await expect(
      opDownscale(new Uint8Array([0]), "image/jpeg", {
        maxWidth: 100,
        quality: 0.8,
        format: "jpeg",
      }),
    ).rejects.toThrow(/OffscreenCanvas/);
  });
});
