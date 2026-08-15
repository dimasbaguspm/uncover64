export type CompressFormat = "gzip" | "deflate" | "deflate-raw" | "brotli" | "lz";

export type DetectKind =
  | "jwt"
  | "json"
  | "text"
  | "png"
  | "jpeg"
  | "gif"
  | "webp"
  | "mp4"
  | "webm"
  | "mkv"
  | "mp3"
  | "wav"
  | "avi"
  | "pdf"
  | "zip"
  | "gzip"
  | "wasm"
  | "binary"
  | "empty";

export interface FileInfo {
  kind: DetectKind;
  mime: string;
  ext: string;
  label: string;
}

export interface Variation {
  algorithm: CompressFormat;
  quality: number;
  byteLength: number;
  base64Length: number;
  base64: string;
  ms: number;
}

export interface EncodeAllResult {
  base64: string;
  mime: string;
  kind: DetectKind;
  rawSizeBytes: number;
  rawBase64Length: number;
  variations: Variation[];
  ms: number;
}

export interface JwtParts {
  header: string;
  payload: string;
}

export interface DecodeResult {
  input: string;
  bytes: Uint8Array;
  sizeBytes: number;
  info: FileInfo;
  isUtf8: boolean;
  text?: string;
  jwt?: JwtParts | null;
  image?: { width: number; height: number } | null;
  decompressed?: CompressFormat;
  ms: number;
}

export interface DownscaleOptions {
  maxWidth: number;
  quality: number;
  format: "jpeg" | "webp";
}

export interface DownscaleResult {
  bytes: Uint8Array;
  mime: string;
  width: number;
  height: number;
  base64: string;
  ms: number;
}

export type DecompressOption = "auto" | CompressFormat | null;

export type ExportFormat = "raw" | "datauri" | "env" | "k8s";

export interface EncodeSelection {
  algorithm: CompressFormat;
  quality: number;
}

export type WorkerRequest =
  | { id: string; type: "encodeAll"; bytes: ArrayBuffer }
  | { id: string; type: "encodeSelected"; bytes: ArrayBuffer; selections: EncodeSelection[] }
  | { id: string; type: "decode"; input: string; decompress: DecompressOption }
  | {
      id: string;
      type: "downscale";
      bytes: ArrayBuffer;
      mime: string;
      opts: DownscaleOptions;
    };

export type WorkerResponse =
  | { id: string; ok: true; type: "encodeAll"; result: EncodeAllResult }
  | { id: string; ok: true; type: "encodeSelected"; result: EncodeAllResult }
  | { id: string; ok: true; type: "decode"; result: DecodeResult }
  | { id: string; ok: true; type: "downscale"; result: DownscaleResult }
  | { id: string; ok: false; type: WorkerRequest["type"]; error: string };
