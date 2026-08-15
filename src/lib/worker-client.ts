import type {
  DecompressOption,
  DecodeResult,
  DownscaleOptions,
  DownscaleResult,
  EncodeAllResult,
  EncodeSelection,
  WorkerRequest,
  WorkerResponse,
} from "./types";

type Pending = {
  resolve: (res: unknown) => void;
  reject: (err: Error) => void;
};

let worker: Worker | null = null;
const pending = new Map<string, Pending>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("../worker/core.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      const p = pending.get(msg.id);
      if (!p) return;
      pending.delete(msg.id);
      if (msg.ok) p.resolve(msg.result);
      else p.reject(new Error(msg.error));
    };
    worker.onerror = () => {
      for (const p of pending.values()) p.reject(new Error("Worker crashed"));
      pending.clear();
    };
  }
  return worker;
}

/** Create the worker and wait until it is responsive (used at app boot). */
export function initWorker(): Promise<void> {
  return new Promise((resolve) => {
    const w = getWorker();
    const onMessage = (e: MessageEvent<{ type?: string }>) => {
      if (e.data?.type === "pong") {
        w.removeEventListener("message", onMessage);
        resolve();
      }
    };
    w.addEventListener("message", onMessage);
    w.postMessage({ type: "ping" });
  });
}

function post<R>(req: WorkerRequest, transfer: Transferable[] = []): Promise<R> {
  const id = req.id;
  return new Promise<R>((resolve, reject) => {
    pending.set(id, {
      resolve: resolve as (res: unknown) => void,
      reject,
    });
    getWorker().postMessage(req, transfer);
  });
}

let requestSeq = 0;

export function encodeAll(bytes: ArrayBuffer): Promise<EncodeAllResult> {
  return post<EncodeAllResult>({ id: `a${++requestSeq}`, type: "encodeAll", bytes }, [bytes]);
}

export function encodeSelected(
  bytes: ArrayBuffer,
  selections: EncodeSelection[],
): Promise<EncodeAllResult> {
  return post<EncodeAllResult>(
    { id: `s${++requestSeq}`, type: "encodeSelected", bytes, selections },
    [bytes],
  );
}

export function decodeInput(
  input: string,
  decompress: DecompressOption = "auto",
): Promise<DecodeResult> {
  return post<DecodeResult>({
    id: `d${++requestSeq}`,
    type: "decode",
    input,
    decompress,
  });
}

export function downscaleImage(
  bytes: ArrayBuffer,
  mime: string,
  opts: DownscaleOptions,
): Promise<DownscaleResult> {
  return post<DownscaleResult>({ id: `r${++requestSeq}`, type: "downscale", bytes, mime, opts }, [
    bytes,
  ]);
}
