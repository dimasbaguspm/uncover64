import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  DecompressOption,
  DecodeResult,
  DownscaleOptions,
  DownscaleResult,
  EncodeAllResult,
  EncodeSelection,
} from "../lib/types";
import * as worker from "../lib/worker-client";
import { trackEvent } from "../lib/analytics/track";
import { logDebug, logError } from "../lib/analytics/otel";
import { toErrorMessage } from "../lib/utils/error";
import { tryCatch } from "../lib/utils/try-catch";

interface WorkerContextValue {
  busy: boolean;
  error: string | null;
  clearError: () => void;
  encodeAll: (bytes: ArrayBuffer) => Promise<EncodeAllResult | null>;
  encodeSelected: (
    bytes: ArrayBuffer,
    selections: EncodeSelection[],
  ) => Promise<EncodeAllResult | null>;
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

  const run = useCallback(
    async <T,>(fn: () => Promise<T>, event?: string, message?: string): Promise<T | null> => {
      const started = performance.now();
      setBusy(true);
      setError(null);
      const opName = event ?? message ?? "op";
      logDebug(`worker ${opName} start`);
      // tryCatch logs errors by default; opt out so the failure is logged
      // exactly once here, with the op context and timing.
      return tryCatch(fn, {
        log: false,
        message,
        onSuccess: () => {
          if (event) void trackEvent(event);
          logDebug(`worker ${opName} ok`, { ms: Math.round(performance.now() - started) });
        },
        onError: (err) => {
          setError(toErrorMessage(err));
          logError(err, message ?? `worker ${opName} failed`, {
            ms: Math.round(performance.now() - started),
          });
        },
        onFinished: () => setBusy(false),
      });
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);
  const encodeAll = useCallback(
    (bytes: ArrayBuffer) => run(() => worker.encodeAll(bytes), "encode"),
    [run],
  );
  const encodeSelected = useCallback(
    (bytes: ArrayBuffer, selections: EncodeSelection[]) =>
      run(() => worker.encodeSelected(bytes, selections), "encode"),
    [run],
  );
  const decode = useCallback(
    (input: string, decompress: DecompressOption = "auto") =>
      run(() => worker.decodeInput(input, decompress), "decode", "Decode failed"),
    [run],
  );
  const downscale = useCallback(
    (bytes: ArrayBuffer, mime: string, opts: DownscaleOptions) =>
      run(() => worker.downscaleImage(bytes, mime, opts), "downscale"),
    [run],
  );

  const value = useMemo<WorkerContextValue>(
    () => ({ busy, error, clearError, encodeAll, encodeSelected, decode, downscale }),
    [busy, error, clearError, encodeAll, encodeSelected, decode, downscale],
  );

  return <WorkerContext.Provider value={value}>{children}</WorkerContext.Provider>;
}

export function useWorker(): WorkerContextValue {
  const ctx = useContext(WorkerContext);
  if (!ctx) throw new Error("useWorker must be used within a WorkerProvider");
  return ctx;
}
