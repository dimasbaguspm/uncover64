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

/**
 * Send an event as an OTLP JSON log to `${otelUrl}/v1/logs` — the same
 * endpoint/payload shape the collector accepts (verified with curl).
 */
export async function sendOtlpLog(
  name: string,
  level: keyof typeof SEVERITY = "info",
  props?: Record<string, unknown>,
): Promise<void> {
  const base = ANALYTICS.otelUrl;
  if (!base) return;
  const attributes = Object.entries(props ?? {}).map(([k, v]) => ({ key: k, value: valueOf(v) }));
  const body = {
    resourceLogs: [
      {
        resource: {
          attributes: [{ key: "service.name", value: { stringValue: "uncover64" } }],
        },
        scopeLogs: [
          {
            scope: { name: "uncover64" },
            logRecords: [
              {
                severityNumber: SEVERITY[level],
                severityText: level.toUpperCase(),
                timeUnixNano: String(Date.now() * 1e6),
                body: { stringValue: name },
                ...(attributes.length ? { attributes } : {}),
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
      body: JSON.stringify(body),
    });
  } catch {
    /* telemetry is best-effort */
  }
}
