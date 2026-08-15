import { ANALYTICS } from "../../constants/analytics";

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

/** Rich, always-on context attached to every log. */
function context(props?: Record<string, unknown>): Record<string, unknown> {
  return {
    browser: typeof navigator !== "undefined" ? navigator.userAgent : "",
    version: import.meta.env.VITE_APP_VERSION ?? "",
    environment: import.meta.env.MODE,
    page: typeof location !== "undefined" ? location.pathname : "",
    url: typeof location !== "undefined" ? location.href : "",
    ...props,
  };
}

async function postOtlpLog(
  level: string,
  body: string,
  attrs: Record<string, unknown>,
): Promise<void> {
  const base = ANALYTICS.otelUrl;
  if (!base) return;
  const attributes = Object.entries(attrs).map(([k, v]) => ({ key: k, value: valueOf(v) }));
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
  try {
    await fetch(`${base}/v1/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* telemetry is best-effort */
  }
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
