import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  DecompressOption,
  DecodeResult,
  DownscaleOptions,
  DownscaleResult,
  EncodeAllResult,
} from "../lib/types";
import * as worker from "../lib/worker-client";
import { trackEvent } from "../lib/analytics/track";
import { toErrorMessage } from "../lib/utils/error";

interface WorkerContextValue {
  busy: boolean;
  error: string | null;
  clearError: () => void;
  encodeAll: (bytes: ArrayBuffer) => Promise<EncodeAllResult | null>;
  decode: (input: string, decompress?: DecompressOption) => Promise<DecodeResult | null>;
  downscale: (
    bytes: ArrayBuffer,
    mime: string,
    opts: DownscaleOptions,
  ) => Promise<DownscaleResult | null>;
}

const WorkerContext = createContext<WorkerContextValue | null>(null);

export function WorkerProvider({ children }: { children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(fn: () => Promise<T>, event?: string): Promise<T | null> => {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (event) void trackEvent(event);
      return res;
    } catch (err) {
      const message = toErrorMessage(err);
      setError(message);
      void trackEvent("error", { message });
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const value = useMemo<WorkerContextValue>(
    () => ({
      busy,
      error,
      clearError: () => setError(null),
      encodeAll: (bytes) => run(() => worker.encodeAll(bytes), "encode"),
      decode: (input, decompress = "auto") =>
        run(() => worker.decodeInput(input, decompress), "decode"),
      downscale: (bytes, mime, opts) =>
        run(() => worker.downscaleImage(bytes, mime, opts), "downscale"),
    }),
    [busy, error, run],
  );

  return <WorkerContext.Provider value={value}>{children}</WorkerContext.Provider>;
}

export function useWorker(): WorkerContextValue {
  const ctx = useContext(WorkerContext);
  if (!ctx) throw new Error("useWorker must be used within a WorkerProvider");
  return ctx;
}
