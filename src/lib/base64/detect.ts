import type { DetectKind, FileInfo } from "@/lib/types";
import { utf8Decode } from "./base64";

const img = (ext: string, mimeType: string, label: string): FileInfo => ({
  kind: ext as DetectKind,
  mime: mimeType,
  ext,
  label,
});

const MEDIA_MIME: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mkv: "video/x-matroska",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  avi: "video/x-msvideo",
};

const media = (kind: DetectKind, ext: string, label: string): FileInfo => ({
  kind,
  ext,
  label,
  mime: MEDIA_MIME[ext] ?? "application/octet-stream",
});

export function detect(bytes: Uint8Array): FileInfo {
  const head = bytes.subarray(0, 12);
  const starts = (...sigs: number[]) => sigs.every((b, i) => head[i] === b);

  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) {
    return img("png", "image/png", "PNG image");
  }
  if (starts(0xff, 0xd8, 0xff)) {
    return img("jpeg", "image/jpeg", "JPEG image");
  }
  if (starts(0x47, 0x49, 0x46, 0x38)) {
    return img("gif", "image/gif", "GIF image");
  }
  if (starts(0x1a, 0x45, 0xdf, 0xa3)) {
    const ascii = Array.from(bytes.subarray(0, 64))
      .map((b) => String.fromCharCode(b))
      .join("");
    if (ascii.includes("webm")) return media("webm", "webm", "WebM video");
    return media("mkv", "mkv", "MKV video");
  }
  if (head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70) {
    return media("mp4", "mp4", "MP4 video");
  }
  if (starts(0x49, 0x44, 0x33) || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0)) {
    return media("mp3", "mp3", "MP3 audio");
  }
  if (starts(0x52, 0x49, 0x46, 0x46)) {
    if (head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50) {
      return img("webp", "image/webp", "WebP image");
    }
    if (head[8] === 0x57 && head[9] === 0x41 && head[10] === 0x56 && head[11] === 0x45) {
      return media("wav", "wav", "WAV audio");
    }
    if (head[8] === 0x41 && head[9] === 0x56 && head[10] === 0x49 && head[11] === 0x20) {
      return media("avi", "avi", "AVI video");
    }
  }
  if (starts(0x25, 0x50, 0x44, 0x46)) {
    return { kind: "pdf", mime: "application/pdf", ext: "pdf", label: "PDF document" };
  }
  if (starts(0x1f, 0x8b)) {
    return { kind: "gzip", mime: "application/gzip", ext: "gz", label: "Gzip stream" };
  }
  if (starts(0x50, 0x4b, 0x03, 0x04)) {
    return { kind: "zip", mime: "application/zip", ext: "zip", label: "ZIP archive" };
  }
  if (starts(0x00, 0x61, 0x73, 0x6d)) {
    return {
      kind: "wasm",
      mime: "application/wasm",
      ext: "wasm",
      label: "WebAssembly module",
    };
  }
  if (bytes.length === 0) {
    return { kind: "empty", mime: "application/octet-stream", ext: "bin", label: "Empty" };
  }

  const text = utf8Decode(bytes);
  if (text !== null) {
    const t = text.trimStart();
    if (t.startsWith("{") || t.startsWith("[")) {
      return { kind: "json", mime: "application/json", ext: "json", label: "JSON" };
    }
    return { kind: "text", mime: "text/plain", ext: "txt", label: "Plain text" };
  }
  return {
    kind: "binary",
    mime: "application/octet-stream",
    ext: "bin",
    label: "Binary data",
  };
}
