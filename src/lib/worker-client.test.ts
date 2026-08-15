import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MsgListener = (e: { data: unknown }) => void;

interface MockWorkerInstance {
  onmessage: MsgListener | null;
  onerror: ((e: unknown) => void) | null;
  posted: unknown[];
  transfers: unknown[];
  listeners: Map<string, MsgListener[]>;
  addEventListener: (type: string, cb: MsgListener) => void;
  removeEventListener: (type: string, cb: MsgListener) => void;
  postMessage: (msg: unknown, transfer?: unknown) => void;
}

let captured: MockWorkerInstance | null = null;

function stubWorker() {
  class MockWorker implements MockWorkerInstance {
    onmessage: MsgListener | null = null;
    onerror: ((e: unknown) => void) | null = null;
    posted: unknown[] = [];
    transfers: unknown[] = [];
    listeners = new Map<string, MsgListener[]>();

    constructor() {
      captured = this;
    }

    addEventListener(type: string, cb: MsgListener) {
      const arr = this.listeners.get(type) ?? [];
      arr.push(cb);
      this.listeners.set(type, arr);
    }

    removeEventListener(type: string, cb: MsgListener) {
      const arr = this.listeners.get(type) ?? [];
      this.listeners.set(
        type,
        arr.filter((l) => l !== cb),
      );
    }

    postMessage(msg: unknown, transfer?: unknown) {
      this.posted.push(msg);
      this.transfers.push(transfer);
    }
  }
  vi.stubGlobal("Worker", MockWorker);
}

/** Deliver a worker response to the request handler and any message listeners. */
function emitMessage(data: unknown) {
  const w = captured!;
  w.onmessage?.({ data });
  for (const l of w.listeners.get("message") ?? []) l({ data });
}

async function loadWorker() {
  vi.resetModules();
  return await import("./worker-client");
}

beforeEach(() => {
  captured = null;
  stubWorker();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("worker-client", () => {
  it("posts an encodeAll request and resolves with the worker result", async () => {
    const wc = await loadWorker();
    const bytes = new ArrayBuffer(4);
    const promise = wc.encodeAll(bytes);

    const req = captured!.posted[0] as { id: string; type: string; bytes: ArrayBuffer };
    expect(req.type).toBe("encodeAll");
    expect(req.bytes).toBe(bytes);
    expect(captured!.transfers[0]).toEqual([bytes]);

    emitMessage({ id: req.id, ok: true, type: "encodeAll", result: { variations: [] } });
    await expect(promise).resolves.toEqual({ variations: [] });
  });

  it("increments the request sequence across calls", async () => {
    const wc = await loadWorker();
    wc.encodeAll(new ArrayBuffer(1));
    wc.decodeInput("aGk=");
    wc.encodeSelected(new ArrayBuffer(1), []);
    wc.downscaleImage(new ArrayBuffer(1), "image/png", { maxWidth: 100, quality: 0.7, format: "webp" });

    const ids = captured!.posted.map((p) => (p as { id: string }).id);
    expect(ids).toEqual(["a1", "d2", "s3", "r4"]);
  });

  it("defaults the decompress option on decode", async () => {
    const wc = await loadWorker();
    wc.decodeInput("aGk=");

    const req = captured!.posted[0] as { id: string; type: string; decompress: unknown };
    expect(req.type).toBe("decode");
    expect(req.decompress).toBe("auto");
  });

  it("rejects when the worker reports an error", async () => {
    const wc = await loadWorker();
    const promise = wc.decodeInput("aGk=");

    const req = captured!.posted[0] as { id: string };
    emitMessage({ id: req.id, ok: false, type: "decode", error: "bad input" });
    await expect(promise).rejects.toThrow("bad input");
  });

  it("resolves initWorker once the worker pongs", async () => {
    const wc = await loadWorker();
    const promise = wc.initWorker();

    expect((captured!.posted[0] as { type: string }).type).toBe("ping");
    emitMessage({ type: "pong" });
    await expect(promise).resolves.toBeUndefined();
  });

  it("rejects pending requests when the worker crashes", async () => {
    const wc = await loadWorker();
    const promise = wc.encodeAll(new ArrayBuffer(1));

    captured!.onerror?.({});
    await expect(promise).rejects.toThrow("Worker crashed");
  });
});
