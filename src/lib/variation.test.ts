import { describe, expect, it } from "vitest";
import { RAW_KEY, parseVariationKey, variationKey } from "./variation";

describe("variationKey", () => {
  it("returns RAW_KEY for null algorithm", () => {
    expect(variationKey(null)).toBe(RAW_KEY);
  });
  it("returns bare algo when no quality", () => {
    expect(variationKey("gzip")).toBe("gzip");
  });
  it("formats algo:quality", () => {
    expect(variationKey("brotli", 80)).toBe("brotli:80");
  });
});

describe("parseVariationKey", () => {
  it("parses raw", () => {
    expect(parseVariationKey(RAW_KEY)).toEqual({ algorithm: null, quality: null });
  });
  it("parses algo only", () => {
    expect(parseVariationKey("lz")).toEqual({ algorithm: "lz", quality: null });
  });
  it("parses algo:quality", () => {
    expect(parseVariationKey("gzip:50")).toEqual({ algorithm: "gzip", quality: 50 });
  });
  it("round-trips with variationKey", () => {
    const k = variationKey("deflate", 90);
    expect(parseVariationKey(k)).toEqual({ algorithm: "deflate", quality: 90 });
  });
});
