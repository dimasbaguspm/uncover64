import type { CompressFormat, DecompressOption } from "../lib/types";

export const COMPRESSION_ALGOS: { id: CompressFormat; label: string; note: string }[] = [
  { id: "gzip", label: "Gzip", note: "native" },
  { id: "deflate", label: "Deflate", note: "native" },
  { id: "deflate-raw", label: "Deflate-raw", note: "native" },
  { id: "brotli", label: "Brotli", note: "WASM" },
];

export const COMPRESSION_LABELS: Record<CompressFormat, string> = {
  gzip: "Gzip",
  deflate: "Deflate",
  "deflate-raw": "Deflate-raw",
  brotli: "Brotli",
  lz: "LZ-String",
};

export const DECOMPRESS_OPTIONS: { id: DecompressOption; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "gzip", label: "Gzip" },
  { id: "deflate", label: "Deflate" },
  { id: "deflate-raw", label: "Deflate-raw" },
  { id: "brotli", label: "Brotli" },
  { id: "lz", label: "LZ-String" },
  { id: null, label: "Off" },
];

export const COMPRESSION_QUALITIES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

export const QUALITY_ORIGINAL = 100;

export const ALL_COMPRESSION_ALGOS: CompressFormat[] = [
  "gzip",
  "deflate",
  "deflate-raw",
  "brotli",
  "lz",
];
