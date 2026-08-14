import { fromByteArray, toByteArray } from "base64-js";

export function bytesToBase64(bytes: Uint8Array): string {
  return fromByteArray(bytes as Uint8Array<ArrayBuffer>);
}

export function base64ToBytes(b64: string): Uint8Array {
  return toByteArray(b64);
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlToBytes(b64: string): Uint8Array {
  const padded = b64
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
  return base64ToBytes(padded);
}

/**
 * Normalize user pasted base64: strips data-URI prefix, whitespace,
 * and tolerates base64url characters. Throws on input that cannot be base64.
 */
export function normalizeBase64(input: string): string {
  let s = input.trim();
  if (!s) throw new Error("Input is empty");
  const dataIdx = s.indexOf(";base64,");
  if (s.startsWith("data:") && dataIdx !== -1) {
    s = s.slice(dataIdx + ";base64,".length);
  }
  s = s.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) {
    throw new Error("Input is not valid base64");
  }
  return s.padEnd(s.length + ((4 - (s.length % 4)) % 4), "=");
}

export function utf8Encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function utf8Decode(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function isJwtToken(input: string): boolean {
  const s = input.trim();
  if (!s.startsWith("eyJ")) return false;
  return s.split(".").length === 3;
}
