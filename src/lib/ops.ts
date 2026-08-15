import type {
  CompressFormat,
  DecodeResult,
  DecompressOption,
  DownscaleOptions,
  DownscaleResult,
  EncodeAllResult,
  EncodeSelection,
  FileInfo,
  JwtParts,
  Variation,
} from "./types";
import { QUALITY_ORIGINAL } from "@/constants/compression";
import * as pako from "pako";
import * as LZString from "lz-string";
import { sum } from "radash";
import {
  base64ToBytes,
  base64UrlToBytes,
  bytesToBase64,
  isJwtToken,
  normalizeBase64,
  utf8Decode,
  utf8Encode,
} from "@/lib/base64";
import { detect } from "@/lib/base64";
import { tryCatch } from "@/lib/utils/try-catch";
import { logDebug, logWarn } from "@/lib/analytics/otel";

export class CompressionUnavailableError extends Error {}

type BrotliApi = {
  compress(data: Uint8Array, opts?: { quality?: number }): Uint8Array;
  compressAsync?(data: Uint8Array, opts?: { quality?: number }): Promise<Uint8Array>;
  decompress(data: Uint8Array): Uint8Array;
  decompressAsync?(data: Uint8Array): Promise<Uint8Array>;
};

let brotliModule: BrotliApi | null = null;

async function getBrotli(): Promise<BrotliApi> {
  if (!brotliModule) {
    const mod = await import("brotli-wasm");
    brotliModule = await mod.default;
  }
  return brotliModule;
}

async function brotliCompress(bytes: Uint8Array, level: number): Promise<Uint8Array> {
  const brotli = await getBrotli();
  if (brotli.compressAsync) {
    return brotli.compressAsync(bytes, { quality: level });
  }
  return brotli.compress(bytes, { quality: level });
}

async function brotliDecompress(bytes: Uint8Array): Promise<Uint8Array> {
  const brotli = await getBrotli();
  if (brotli.decompressAsync) return brotli.decompressAsync(bytes);
  return brotli.decompress(bytes);
}

async function pipeStream(
  stream: TransformStream<Uint8Array, Uint8Array>,
  bytes: Uint8Array,
): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  void writer.write(bytes);
  void writer.close();
  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = sum(chunks, (c) => c.byteLength);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}

function qualityToPakoLevel(quality: number): number {
  const level = Math.round(9 - ((quality - 10) / 80) * 8);
  return Math.max(1, Math.min(9, level));
}

function qualityToBrotliLevel(quality: number): number {
  const level = Math.round(11 - ((quality - 10) / 80) * 10);
  return Math.max(1, Math.min(11, level));
}

function bytesToBinaryString(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return bin;
}

function binaryStringToBytes(bin: string): Uint8Array {
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function lzCompress(bytes: Uint8Array): Uint8Array {
  return base64ToBytes(LZString.compressToBase64(bytesToBinaryString(bytes)));
}

function lzDecompress(bytes: Uint8Array): Uint8Array {
  const bin = LZString.decompressFromBase64(bytesToBase64(bytes)) ?? "";
  return binaryStringToBytes(bin);
}

export async function compressBytes(
  bytes: Uint8Array,
  algo: CompressFormat,
  quality = 50,
): Promise<Uint8Array> {
  if (algo === "lz") return lzCompress(bytes);
  if (quality >= QUALITY_ORIGINAL) return bytes.slice(); // 100 = original
  if (algo === "brotli") return brotliCompress(bytes, qualityToBrotliLevel(quality));
  const level = qualityToPakoLevel(quality);
  if (algo === "gzip") return pako.gzip(bytes, { level });
  if (algo === "deflate") return pako.deflate(bytes, { level });
  return pako.deflateRaw(bytes, { level });
}

async function decompressBytes(bytes: Uint8Array, algo: CompressFormat): Promise<Uint8Array> {
  if (algo === "lz") return lzDecompress(bytes);
  if (algo === "brotli") {
    return brotliDecompress(bytes);
  }
  if (!("DecompressionStream" in globalThis)) {
    throw new CompressionUnavailableError(`DecompressionStream is not available in this browser`);
  }
  return pipeStream(
    new DecompressionStream(algo) as unknown as TransformStream<Uint8Array, Uint8Array>,
    bytes,
  );
}

function isPlainText(detected: FileInfo): boolean {
  return detected.kind === "text" || detected.kind === "json" || detected.kind === "jwt";
}

/**
 * Auto-detect compression. Fast magic-byte paths (gzip, zlib/deflate) come
 * first; the remaining algorithms are probed. gzip/deflate/deflate-raw
 * (DecompressionStream) and brotli (wasm) fail loudly on mismatched input, so
 * "no throw + non-empty" is a reliable signal. lz-string is lenient (returns
 * empty/garbage instead of throwing), so its output must also be valid UTF-8.
 */
async function autoDetectCompression(
  bytes: Uint8Array,
): Promise<{ algo: CompressFormat; bytes: Uint8Array } | null> {
  const tryOne = async (algo: CompressFormat): Promise<Uint8Array | null> => {
    try {
      const out = await decompressBytes(bytes, algo);
      if (out.length === 0) return null;
      if (algo === "lz" && utf8Decode(out) === null) return null;
      return out;
    } catch {
      return null;
    }
  };

  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    const out = await tryOne("gzip");
    return out ? { algo: "gzip", bytes: out } : null;
  }
  if (
    bytes.length >= 2 &&
    (bytes[0] & 0x0f) === 8 && // CMF low nibble: deflate method
    ((bytes[0] << 8) + bytes[1]) % 31 === 0 // header checksum
  ) {
    const out = await tryOne("deflate");
    if (out) return { algo: "deflate", bytes: out };
  }

  for (const algo of ["deflate", "deflate-raw", "brotli", "lz"] as const) {
    const out = await tryOne(algo);
    if (out) return { algo, bytes: out };
  }
  return null;
}

export async function opEncodeSelected(
  bytes: Uint8Array,
  selections: EncodeSelection[],
): Promise<EncodeAllResult> {
  const t0 = performance.now();
  const info = detect(bytes);
  const base64 = bytesToBase64(bytes);
  const results = await Promise.all(
    selections.map((sel) =>
      tryCatch<Variation>(
        async () => {
          const t0 = performance.now();
          const compressed = await compressBytes(bytes, sel.algorithm, sel.quality);
          const encoded = bytesToBase64(compressed);
          return {
            algorithm: sel.algorithm,
            quality: sel.quality,
            byteLength: compressed.byteLength,
            base64Length: encoded.length,
            base64: encoded,
            ms: performance.now() - t0,
          };
        },
        { log: false },
      ),
    ),
  );
  const variations = results.filter((v): v is Variation => v !== null);
  logDebug("encodeSelected complete", {
    algorithm: info.kind,
    rawBytes: bytes.byteLength,
    variations: variations.length,
    ms: Math.round(performance.now() - t0),
  });
  return {
    base64,
    mime: info.mime,
    kind: info.kind,
    rawSizeBytes: bytes.byteLength,
    rawBase64Length: base64.length,
    variations,
    ms: performance.now() - t0,
  };
}

function parseJwt(input: string): JwtParts | null {
  const parts = input.trim().split(".");
  if (parts.length !== 3 || !parts[0].startsWith("eyJ")) return null;
  const dec = (s: string) => {
    try {
      return JSON.parse(new TextDecoder().decode(base64UrlToBytes(s)));
    } catch {
      return null;
    }
  };
  const header = dec(parts[0]);
  const payload = dec(parts[1]);
  if (header === null || payload === null) return null;
  return {
    header: JSON.stringify(header, null, 2),
    payload: JSON.stringify(payload, null, 2),
  };
}

async function imageDims(bytes: Uint8Array): Promise<{ width: number; height: number } | null> {
  if (!("createImageBitmap" in globalThis)) return null;
  return tryCatch(
    async () => {
      const bmp = await createImageBitmap(new Blob([bytes as Uint8Array<ArrayBuffer>]));
      const { width, height } = bmp;
      bmp.close();
      return { width, height };
    },
    { log: false },
  );
}

export async function opDecode(
  input: string,
  decompress: DecompressOption = "auto",
): Promise<DecodeResult> {
  const t0 = performance.now();
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Input is empty");

  if (isJwtToken(trimmed)) {
    const jwt = parseJwt(trimmed);
    const bytes = utf8Encode(trimmed);
    return {
      input: trimmed,
      bytes,
      sizeBytes: bytes.byteLength,
      info: { kind: "jwt", mime: "text/plain", ext: "jwt", label: "JWT (JSON Web Token)" },
      isUtf8: true,
      text: trimmed,
      jwt,
      image: null,
      ms: performance.now() - t0,
    };
  }

  const b64 = normalizeBase64(trimmed);
  const bytes = base64ToBytes(b64);
  let detected = detect(bytes);

  let finalBytes = bytes;
  let decompressed: CompressFormat | undefined;
  if (decompress === "auto") {
    if (!isPlainText(detected)) {
      const hit = await autoDetectCompression(bytes);
      if (hit) {
        finalBytes = hit.bytes;
        decompressed = hit.algo;
        detected = detect(finalBytes);
        logDebug("decode auto-detected", { algo: hit.algo });
      } else {
        logDebug("decode auto: no compression detected", { kind: detected.kind });
      }
    }
  } else if (decompress) {
    try {
      finalBytes = await decompressBytes(bytes, decompress);
      decompressed = decompress;
      detected = detect(finalBytes);
    } catch {
      decompressed = undefined;
      logWarn("decode decompress failed", { algo: decompress });
    }
  }

  const text = utf8Decode(finalBytes);
  let image: { width: number; height: number } | null = null;
  if (
    detected.kind === "png" ||
    detected.kind === "jpeg" ||
    detected.kind === "gif" ||
    detected.kind === "webp"
  ) {
    image = await imageDims(finalBytes);
  }
  return {
    input: trimmed,
    bytes: finalBytes,
    sizeBytes: finalBytes.byteLength,
    info: detected,
    isUtf8: text !== null,
    text: text ?? undefined,
    jwt: null,
    image,
    decompressed,
    ms: performance.now() - t0,
  };
}

export async function opDownscale(
  bytes: Uint8Array,
  mime: string,
  opts: DownscaleOptions,
): Promise<DownscaleResult> {
  const t0 = performance.now();
  if (!("createImageBitmap" in globalThis) || !("OffscreenCanvas" in globalThis)) {
    throw new Error(
      "Image downscaling requires OffscreenCanvas, which is unavailable in this browser",
    );
  }
  const bmp = await createImageBitmap(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mime }));
  const scale = Math.min(1, opts.maxWidth / bmp.width);
  const width = Math.max(1, Math.round(bmp.width * scale));
  const height = Math.max(1, Math.round(bmp.height * scale));

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");
  ctx.drawImage(bmp, 0, 0, width, height);
  bmp.close();

  const outMime = opts.format === "jpeg" ? "image/jpeg" : "image/webp";
  const blob = await canvas.convertToBlob({ type: outMime, quality: opts.quality });
  const out = new Uint8Array(await blob.arrayBuffer());
  return {
    bytes: out,
    mime: outMime,
    width,
    height,
    base64: bytesToBase64(out),
    ms: performance.now() - t0,
  };
}
