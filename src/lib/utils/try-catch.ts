import { logError } from "../analytics/otel";

export interface TryCatchCallbacks<T> {
  /** Default true — send caught errors to OTEL. Set false for graceful/noise-free skips. */
  log?: boolean;
  /** Descriptive message recorded in the OTEL log. Defaults to "Operation failed". */
  message?: string;
  onError?: (err: unknown) => void;
  onFinished?: (data: T | null, err: unknown) => void;
  onSuccess?: (data: T) => void;
}

/**
 * Reusable try/catch: runs `fn`, logs failures to OTEL, and exposes
 * onError / onSuccess / onFinished callbacks. Returns the result or null.
 *
 * tryCatch<Thing>(() => thing(), {
 *   onError: (e) => {},
 *   onFinished: (data, e) => {},
 *   onSuccess: (data) => {},
 * });
 */
export async function tryCatch<T>(
  fn: () => T | Promise<T>,
  callbacks: TryCatchCallbacks<T> = {},
): Promise<T | null> {
  let data: T | null = null;
  let err: unknown = null;
  try {
    data = await fn();
    callbacks.onSuccess?.(data);
  } catch (e) {
    err = e;
    if (callbacks.log !== false) void logError(e, callbacks.message ?? "Operation failed");
    callbacks.onError?.(e);
  } finally {
    callbacks.onFinished?.(data, err);
  }
  return data;
}
