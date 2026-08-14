import { describe, expect, it } from "vitest";
import {
  base64ToBytes,
  base64UrlToBytes,
  bytesToBase64,
  bytesToBase64Url,
  isJwtToken,
  normalizeBase64,
  utf8Decode,
  utf8Encode,
} from "./base64";

describe("base64 roundtrip", () => {
  it("encodes and decodes arbitrary bytes", () => {
    const bytes = new TextEncoder().encode("hello, uncover64!");
    const b64 = bytesToBase64(bytes);
    expect(b64).toBe("aGVsbG8sIHVuY292ZXI2NCE=");
    expect(Array.from(base64ToBytes(b64))).toEqual(Array.from(bytes));
  });

  it("roundtrips empty bytes", () => {
    expect(bytesToBase64(new Uint8Array(0))).toBe("");
    expect(base64ToBytes("")).toEqual(new Uint8Array(0));
  });

  it("roundtrips a large buffer in chunks", () => {
    const bytes = new Uint8Array(200_000);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 31) % 256;
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });
});

describe("normalizeBase64", () => {
  it("strips data URI prefix", () => {
    expect(normalizeBase64("data:image/png;base64,aGVsbG8=")).toBe("aGVsbG8=");
  });

  it("strips whitespace and newlines", () => {
    expect(normalizeBase64("aGVs\nbG8=")).toBe("aGVsbG8=");
  });

  it("handles missing padding", () => {
    expect(normalizeBase64("aGVsbG8")).toBe("aGVsbG8=");
  });

  it("throws on invalid input", () => {
    expect(() => normalizeBase64("!!!not base64!!!")).toThrow();
    expect(() => normalizeBase64("")).toThrow();
  });
});

describe("base64url", () => {
  it("encodes and decodes without padding", () => {
    const bytes = new TextEncoder().encode('{"alg":"RS256"}');
    const url = bytesToBase64Url(bytes);
    expect(url).not.toMatch(/[+/=]/);
    expect(Array.from(base64UrlToBytes(url))).toEqual(Array.from(bytes));
  });
});

describe("utf8", () => {
  it("decodes valid utf-8", () => {
    const bytes = new TextEncoder().encode("héllo ✓");
    expect(utf8Decode(bytes)).toBe("héllo ✓");
    expect(utf8Decode(new Uint8Array([0xff, 0xfe]))).toBeNull();
  });

  it("encodes text to bytes", () => {
    expect(Array.from(utf8Encode("abc"))).toEqual([97, 98, 99]);
  });
});

describe("isJwtToken", () => {
  it("detects three-part eyJ tokens", () => {
    expect(isJwtToken("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature")).toBe(true);
  });

  it("rejects non-JWT base64", () => {
    expect(isJwtToken("aGVsbG8=")).toBe(false);
    expect(isJwtToken("eyJhbGciOiJIUzI1NiJ9.e30")).toBe(false);
  });
});
