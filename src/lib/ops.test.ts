import { afterEach, describe, expect, it, vi } from "vitest";
import { opDecode, opDownscale, opEncodeAll } from "./ops";
import { bytesToBase64, bytesToBase64Url, utf8Encode } from "./base64";

vi.mock("brotli-wasm", async () => {
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const nodePkg = require("brotli-wasm");
  return { default: Promise.resolve(nodePkg) };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("opEncodeAll", () => {
  it("encodes raw text and roundtrips through decode", async () => {
    const res = await opEncodeAll(utf8Encode("hello uncover64"));
    expect(res.base64).toBe(Buffer.from("hello uncover64").toString("base64"));
    const decoded = await opDecode(res.base64);
    expect(decoded.text).toBe("hello uncover64");
    expect(decoded.info.kind).toBe("text");
  });

  it("returns gzip/deflate/brotli variations with sizes", async () => {
    const big = "x".repeat(10_000);
    const res = await opEncodeAll(utf8Encode(big));
    const algorithms = res.variations.map((v) => v.algorithm);
    expect(algorithms).toContain("gzip");
    expect(algorithms).toContain("deflate");
    expect(algorithms).toContain("brotli");
    for (const v of res.variations) {
      expect(v.byteLength).toBeLessThan(res.rawSizeBytes);
      expect(v.base64).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(v.base64Length).toBe(v.base64.length);
    }
  });

  it("roundtrips deflate-raw variation", async () => {
    const res = await opEncodeAll(utf8Encode("deflate-raw roundtrip"));
    const deflateRaw = res.variations.find((v) => v.algorithm === "deflate-raw")!;
    expect(deflateRaw).toBeDefined();
    const decoded = await opDecode(deflateRaw.base64, "deflate-raw");
    expect(decoded.text).toBe("deflate-raw roundtrip");
  });

  it("produces quality tiers 10..90 per algorithm with a large spread", async () => {
    const res = await opEncodeAll(utf8Encode("quality tiers ".repeat(500)));
    const byAlgo = new Map<string, number[]>();
    for (const v of res.variations) {
      if (v.algorithm === "lz") continue; // lz-string has no quality tiers
      const arr = byAlgo.get(v.algorithm) ?? [];
      arr.push(v.quality);
      byAlgo.set(v.algorithm, arr);
    }
    for (const qualities of byAlgo.values()) {
      expect([...qualities].sort((a, b) => a - b)).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90]);
    }
    const gzip = res.variations
      .filter((v) => v.algorithm === "gzip")
      .sort((a, b) => a.quality - b.quality);
    // lower quality = more aggressive = smaller; sizes grow with quality
    for (let i = 1; i < gzip.length; i++) {
      expect(gzip[i].byteLength).toBeGreaterThanOrEqual(gzip[i - 1].byteLength);
    }
    // the most aggressive tier is clearly smaller than the original
    expect(gzip[0].byteLength).toBeLessThan(res.rawSizeBytes);
  });

  it("adds a single lz-string variation that roundtrips", async () => {
    const text = "lz roundtrip ".repeat(100);
    const res = await opEncodeAll(utf8Encode(text));
    const lz = res.variations.find((v) => v.algorithm === "lz");
    expect(lz).toBeDefined();
    const decoded = await opDecode(lz!.base64, "lz");
    expect(decoded.text).toBe(text);
  });

  it("roundtrips gzip variation with auto decompression", async () => {
    const res = await opEncodeAll(utf8Encode("compressed roundtrip"));
    const gzip = res.variations.find((v) => v.algorithm === "gzip")!;
    const decoded = await opDecode(gzip.base64, "auto");
    expect(decoded.decompressed).toBe("gzip");
    expect(decoded.text).toBe("compressed roundtrip");
  });

  it("keeps payload compressed when decompress is off", async () => {
    const res = await opEncodeAll(utf8Encode("stay compressed"));
    const gzip = res.variations.find((v) => v.algorithm === "gzip")!;
    const decoded = await opDecode(gzip.base64, null);
    expect(decoded.info.kind).toBe("gzip");
    expect(decoded.decompressed).toBeUndefined();
  });

  it("supports brotli roundtrip", async () => {
    const res = await opEncodeAll(utf8Encode("brotli roundtrip"));
    const brotli = res.variations.find((v) => v.algorithm === "brotli")!;
    const decoded = await opDecode(brotli.base64, "brotli");
    expect(decoded.text).toBe("brotli roundtrip");
  });

  it("encodes binary bytes and detects them", async () => {
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    const res = await opEncodeAll(png);
    expect(res.mime).toBe("image/png");
    const decoded = await opDecode(res.base64);
    expect(decoded.info.kind).toBe("png");
  });
});

describe("opDecode", () => {
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
