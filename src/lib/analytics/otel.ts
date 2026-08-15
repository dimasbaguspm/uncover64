import { trace } from "@opentelemetry/api";
import { ANALYTICS } from "@/constants/analytics";
import { maskUrl } from "@/lib/utils/mask";
import { getSession } from "@/lib/utils/session";

const SEVERITY: Record<string, number> = {
  trace: 1,
  debug: 5,
  info: 9,
  warn: 13,
  error: 17,
  fatal: 21,
};

type AttrValue = { stringValue: string } | { intValue: string } | { doubleValue: number };

function valueOf(v: unknown): AttrValue {
  if (typeof v === "number")
    return Number.isInteger(v) ? { intValue: String(v) } : { doubleValue: v };
  if (typeof v === "boolean") return { stringValue: String(v) };
  if (typeof v === "object" && v !== null) return { stringValue: JSON.stringify(v) };
  return { stringValue: String(v ?? "") };
}

function isValidId(id: string | undefined, len: number): id is string {
  return typeof id === "string" && id.length === len && /^[0-9a-f]+$/i.test(id);
}

/** Current trace/span ids so logs correlate with the active span. */
function traceContext(): Record<string, string> {
  try {
    const sc = trace.getActiveSpan()?.spanContext();
    if (sc && isValidId(sc.traceId, 32) && isValidId(sc.spanId, 16)) {
      return { traceId: sc.traceId, spanId: sc.spanId };
    }
  } catch {
    /* tracing not initialized */
  }
  return {};
}

/** Rich, always-on context attached to every log. */
function context(props?: Record<string, unknown>): Record<string, unknown> {
  const session = getSession();
  return {
    ...traceContext(),
    sessionId: session.sessionId,
    referrer: session.referrer,
    ...session.utm,
    browser: typeof navigator !== "undefined" ? navigator.userAgent : "",
    version: import.meta.env.VITE_APP_VERSION ?? "",
    environment: import.meta.env.MODE,
    page: typeof location !== "undefined" ? maskUrl(location.pathname) : "",
    url: typeof location !== "undefined" ? maskUrl(location.href) : "",
    ...props,
  };
}

/** Current active span ids (empty object when no span is active). */
export function currentTrace(): { traceId: string; spanId: string } | null {
  const tc = traceContext();
  return tc.traceId ? { traceId: tc.traceId, spanId: tc.spanId } : null;
}

const TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 500;

async function postOtlpLog(
  level: string,
  body: string,
  attrs: Record<string, unknown>,
): Promise<void> {
  const base = ANALYTICS.otelUrl;
  if (!base) return;
  const attributes = Object.entries(attrs).map(([k, v]) => ({ key: k, value: valueOf(v) }));
  // Native OTLP trace/span ids let the collector join logs to their trace.
  const tc = traceContext();
  const payload = {
    resourceLogs: [
      {
        resource: {
          attributes: [
            { key: "service.name", value: { stringValue: "uncover64" } },
            {
              key: "service.version",
              value: { stringValue: import.meta.env.VITE_APP_VERSION ?? "" },
            },
          ],
        },
        scopeLogs: [
          {
            scope: { name: "uncover64" },
            logRecords: [
              {
                ...(tc.traceId ? { traceId: tc.traceId, spanId: tc.spanId } : {}),
                severityNumber: SEVERITY[level] ?? 9,
                severityText: level.toUpperCase(),
                timeUnixNano: String(Date.now() * 1e6),
                body: { stringValue: body },
                attributes,
              },
            ],
          },
        ],
      },
    ],
  };

  // Let fetch derive Content-Length; an explicit/mismatched value (or
  // Transfer-Encoding: chunked) makes the edge/collector reject with 400.
  const send = async (): Promise<boolean> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${base}/v1/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  };

  // One retry for transient failures (network blips, 5xx).
  if (await send()) return;
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  await send();
}

/**
 * Log an error to OTEL. The error is captured as attributes
 * (name, message, stack) alongside the custom message and rich context.
 */
export async function logError(
  err: unknown,
  message: string,
  attrs?: Record<string, unknown>,
): Promise<void> {
  const e = err instanceof Error ? err : new Error(String(err));
  await postOtlpLog(
    "error",
    message,
    context({ errorName: e.name, errorMessage: e.message, stack: e.stack ?? "", ...attrs }),
  );
}

/** Log a warning to OTEL with the active trace/span ids. */
export function logWarn(message: string, attrs?: Record<string, unknown>): void {
  void postOtlpLog("warn", message, context(attrs));
}

/** Log an informational message to OTEL with the active trace/span ids. */
export function logInfo(message: string, attrs?: Record<string, unknown>): void {
  void postOtlpLog("info", message, context(attrs));
}

/** Log a debug message to OTEL with the active trace/span ids. */
export function logDebug(message: string, attrs?: Record<string, unknown>): void {
  void postOtlpLog("debug", message, context(attrs));
}
