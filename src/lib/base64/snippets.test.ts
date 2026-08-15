import { describe, expect, it } from "vitest";
import { goSnippet, nodeSnippet } from "./snippets";

describe("nodeSnippet", () => {
  it("inlines short base64 payloads", () => {
    const out = nodeSnippet("aGk=", null);
    expect(out).toContain("const B64 =");
    expect(out).toContain("'aGk='");
    expect(out).not.toContain("Full base64 payload");
  });

  it("warns about long payloads and omits the value", () => {
    const long = "x".repeat(100);
    const out = nodeSnippet(long, "gzip");
    expect(out).toContain("Full base64 payload is 100 chars.");
    expect(out).not.toContain(`'${long}'`);
  });

  it("uses the matching zlib import per algorithm", () => {
    expect(nodeSnippet("aGk=", "gzip")).toContain("gunzipSync");
    expect(nodeSnippet("aGk=", "brotli")).toContain("brotliDecompressSync");
    expect(nodeSnippet("aGk=", "deflate-raw")).toContain("inflateRawSync");
  });

  it("emits an lz-string snippet for the lz algorithm", () => {
    const out = nodeSnippet("aGk=", "lz");
    expect(out).toContain('decompressFromBase64');
    expect(out).toContain("lz-string");
  });
});

describe("goSnippet", () => {
  it("builds a runnable main with base64 imports", () => {
    const out = goSnippet("aGk=", null);
    expect(out).toContain("package main");
    expect(out).toContain(`const b64 = "aGk="`);
    expect(out).toContain("base64.StdEncoding.DecodeString(b64)");
  });

  it("uses compress/gzip for the gzip algorithm", () => {
    const out = goSnippet("aGk=", "gzip");
    expect(out).toContain('"compress/gzip"');
    expect(out).toContain("gzip.NewReader(bytes.NewReader(raw))");
  });

  it("notes the missing Go decompressor for lz", () => {
    const out = goSnippet("aGk=", "lz");
    expect(out).toContain("no standard Go decompressor");
  });

  it("adds a paste hint for long payloads", () => {
    const out = goSnippet("y".repeat(100), "gzip");
    expect(out).toContain("Base64 payload (100 chars)");
  });
});
