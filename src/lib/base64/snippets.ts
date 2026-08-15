import type { CompressFormat } from "@/lib/types";

const NODE_ZLIB: Record<CompressFormat, string> = {
  gzip: "gunzipSync",
  deflate: "inflateSync",
  "deflate-raw": "inflateRawSync",
  brotli: "brotliDecompressSync",
  lz: "__lz__",
};

export function nodeSnippet(base64: string, algo: CompressFormat | null): string {
  const lines: string[] = [];
  if (algo === "lz") {
    lines.push(
      `// npm i lz-string`,
      `import { decompressFromBase64 } from "lz-string";`,
      ``,
      `const B64 =`,
      `  ${base64.length > 64 ? `'...'  // ${base64.length} chars of base64` : `'${base64}'`}`,
      ``,
      `const bin = decompressFromBase64(B64);`,
      `console.log(bin);`,
    );
    if (base64.length > 64) {
      lines.splice(
        2,
        0,
        `// Full base64 payload is ${base64.length} chars.`,
        `// Paste the real value into the B64 constant above.`,
        ``,
      );
    }
    return lines.join("\n");
  }
  if (algo) {
    lines.push(
      `import { ${NODE_ZLIB[algo]} } from 'node:zlib'`,
      ``,
      `const B64 =`,
      `  ${base64.length > 64 ? `'...'  // ${base64.length} chars of base64` : `'${base64}'`}`,
      ``,
    );
  } else {
    lines.push(`const B64 =`, `  '${base64}'`, ``);
  }
  if (base64.length > 64) {
    lines.push(
      `// Full base64 payload is ${base64.length} chars.`,
      `// Paste the real value into the B64 constant above.`,
      ``,
    );
  }
  lines.push(
    `const raw = Buffer.from(B64, 'base64')`,
    algo ? `const data = ${NODE_ZLIB[algo]}(raw)` : `const data = raw`,
    ``,
    `console.log(data.toString('utf-8'))`,
  );
  return lines.join("\n");
}

const GO_HEADER: Record<CompressFormat, string[]> = {
  gzip: [`"bytes"`, `"compress/gzip"`, `"encoding/base64"`, `"fmt"`, `"io"`, `"log"`],
  deflate: [`"bytes"`, `"compress/flate"`, `"encoding/base64"`, `"fmt"`, `"io"`, `"log"`],
  "deflate-raw": [`"bytes"`, `"compress/flate"`, `"encoding/base64"`, `"fmt"`, `"io"`, `"log"`],
  brotli: [`"bytes"`, `"encoding/base64"`, `"fmt"`, `"io"`, `"log"`],
  lz: [],
};

export function goSnippet(base64: string, algo: CompressFormat | null): string {
  if (algo === "lz") {
    return [
      `// LZ-String has no standard Go decompressor.`,
      `// Use the JavaScript snippet (lz-string) or a language with an LZ-String port.`,
    ].join("\n");
  }
  const imports = algo ? GO_HEADER[algo] : [`"encoding/base64"`, `"fmt"`, `"log"`];
  const parts: string[] = [];
  parts.push(`package main`, ``, `import (`, ...imports.map((i) => `    ${i}`), `)`, ``);
  if (base64.length > 64) {
    parts.push(`// Base64 payload (${base64.length} chars) — paste the real value below.`, ``);
  }
  parts.push(`func main() {`);
  parts.push(`    const b64 = "${base64}"`);
  parts.push(``);
  parts.push(`    raw, err := base64.StdEncoding.DecodeString(b64)`);
  parts.push(`    if err != nil {`);
  parts.push(`        log.Fatal(err)`);
  parts.push(`    }`);
  if (algo === "gzip") {
    parts.push(`    r, err := gzip.NewReader(bytes.NewReader(raw))`);
    parts.push(`    if err != nil {`);
    parts.push(`        log.Fatal(err)`);
    parts.push(`    }`);
    parts.push(`    defer r.Close()`);
    parts.push(`    data, err := io.ReadAll(r)`);
  } else if (algo === "deflate") {
    parts.push(`    r := flate.NewReader(bytes.NewReader(raw))`);
    parts.push(`    defer r.Close()`);
    parts.push(`    data, err := io.ReadAll(r)`);
  } else if (algo === "brotli") {
    parts.push(`    // go get github.com/andybalholm/brotli`);
    parts.push(`    r := brotli.NewReader(bytes.NewReader(raw))`);
    parts.push(`    data, err := io.ReadAll(r)`);
  } else {
    parts.push(`    data := raw`);
  }
  parts.push(`    if err != nil {`);
  parts.push(`        log.Fatal(err)`);
  parts.push(`    }`);
  parts.push(`    fmt.Println(string(data))`);
  parts.push(`}`);
  return parts.join("\n");
}
