/// <reference lib="webworker" />
import type { CompressFormat } from "@/lib/types";
import { bytesToBase64 } from "@/lib/base64";
import { compressBytes } from "@/lib/ops";
interface CompressRequest {
  id: string;
  algo: CompressFormat;
  quality: number;
  bytes: ArrayBuffer;
}
interface CompressResponse {
  id: string;
  ok: boolean;
  byteLength?: number;
  base64?: string;
  ms?: number;
  error?: string;
}

self.onmessage = async (e: MessageEvent<CompressRequest>) => {
  const { id, algo, quality, bytes } = e.data;
  const reply = (msg: CompressResponse) => (self as DedicatedWorkerGlobalScope).postMessage(msg);
  try {
    const t0 = performance.now();
    const out = await compressBytes(new Uint8Array(bytes), algo, quality);
    const base64 = bytesToBase64(out);
    reply({
      id,
      ok: true,
      byteLength: out.byteLength,
      base64,
      ms: performance.now() - t0,
    });
  } catch (err) {
    reply({
      id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
