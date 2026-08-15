/// <reference lib="webworker" />
import type {
  CompressFormat,
  EncodeAllResult,
  Variation,
  WorkerRequest,
  WorkerResponse,
} from "@/lib/types";
import { bytesToBase64 } from "@/lib/base64";
import { detect } from "@/lib/base64";
import { opDecode, opDownscale, opEncodeSelected } from "@/lib/ops";
import { COMPRESSION_QUALITIES, QUALITY_ORIGINAL } from "@/constants/compression";

interface CompressResponse {
  id: string;
  ok: boolean;
  byteLength?: number;
  base64?: string;
  ms?: number;
  error?: string;
}

const compressWorkers = new Map<CompressFormat, Worker>();
let cseq = 0;

function compressViaWorker(
  bytes: Uint8Array,
  algo: CompressFormat,
  quality: number,
): Promise<{ byteLength: number; base64: string; ms: number }> {
  let worker = compressWorkers.get(algo);
  if (!worker) {
    worker = new Worker(new URL("./compress.worker.ts", import.meta.url), {
      type: "module",
    });
    compressWorkers.set(algo, worker);
  }
  return new Promise((resolve, reject) => {
    const id = `c${++cseq}`;
    const onMessage = (e: MessageEvent<CompressResponse>) => {
      if (e.data.id !== id) return;
      worker!.removeEventListener("message", onMessage);
      if (e.data.ok && e.data.byteLength !== undefined && e.data.base64 !== undefined) {
        resolve({
          byteLength: e.data.byteLength,
          base64: e.data.base64,
          ms: e.data.ms ?? 0,
        });
      } else {
        reject(new Error(e.data.error ?? "Compression failed"));
      }
    };
    worker!.addEventListener("message", onMessage);
    const copy = bytes.slice();
    worker!.postMessage({ id, algo, quality, bytes: copy.buffer }, [copy.buffer]);
  });
}

async function encodeAllInWorker(bytes: Uint8Array): Promise<EncodeAllResult> {
  const t0 = performance.now();
  const info = detect(bytes);
  const base64 = bytesToBase64(bytes);
  const algos: CompressFormat[] = ["gzip", "deflate", "deflate-raw", "brotli"];
  const settled = await Promise.allSettled(
    algos.flatMap((algo) =>
      COMPRESSION_QUALITIES.map((quality) => compressViaWorker(bytes, algo, quality)),
    ),
  );
  const variations: Variation[] = [];
  settled.forEach((s, i) => {
    if (s.status === "fulfilled") {
      const algo = algos[Math.floor(i / COMPRESSION_QUALITIES.length)];
      const quality = COMPRESSION_QUALITIES[i % COMPRESSION_QUALITIES.length];
      variations.push({
        algorithm: algo,
        quality,
        byteLength: s.value.byteLength,
        base64Length: s.value.base64.length,
        base64: s.value.base64,
        ms: s.value.ms,
      });
    }
  });
  try {
    const lz = await compressViaWorker(bytes, "lz", QUALITY_ORIGINAL);
    variations.push({
      algorithm: "lz",
      quality: QUALITY_ORIGINAL,
      byteLength: lz.byteLength,
      base64Length: lz.base64.length,
      base64: lz.base64,
      ms: lz.ms,
    });
  } catch {
    /* lz-string unavailable — skip */
  }
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
self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;

  if ((req as { type?: string }).type === "ping") {
    (self as DedicatedWorkerGlobalScope).postMessage({ type: "pong" });
    return;
  }

  const reply = (res: WorkerResponse) => (self as DedicatedWorkerGlobalScope).postMessage(res);

  try {
    switch (req.type) {
      case "encodeAll": {
        const result = await encodeAllInWorker(new Uint8Array(req.bytes));
        reply({ id: req.id, ok: true, type: "encodeAll", result });
        break;
      }
      case "encodeSelected": {
        const result = await opEncodeSelected(new Uint8Array(req.bytes), req.selections);
        reply({ id: req.id, ok: true, type: "encodeSelected", result });
        break;
      }
      case "decode": {
        const result = await opDecode(req.input, req.decompress);
        const res: WorkerResponse = { id: req.id, ok: true, type: "decode", result };
        reply(res);
        break;
      }
      case "downscale": {
        const result = await opDownscale(new Uint8Array(req.bytes), req.mime, req.opts);
        const res: WorkerResponse = { id: req.id, ok: true, type: "downscale", result };
        reply(res);
        break;
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const res: WorkerResponse = { id: req.id, ok: false, type: req.type, error };
    reply(res);
  }
};
