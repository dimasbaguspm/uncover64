import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { UserInteractionInstrumentation } from "@opentelemetry/instrumentation-user-interaction";
import { XMLHttpRequestInstrumentation } from "@opentelemetry/instrumentation-xml-http-request";
import { WebTracerProvider, BatchSpanProcessor } from "@opentelemetry/sdk-trace-web";
import { ANALYTICS } from "../../constants/analytics";

let initialized = false;

/**
 * Bootstrap OpenTelemetry for the web app:
 * - WebTracerProvider + BatchSpanProcessor exporting OTLP/HTTP traces
 * - ZoneContextManager for async-context propagation across async work
 * - Fetch / XHR / user-interaction instrumentation
 *
 * Only runs once, and is a no-op when no collector URL is configured.
 */
export function initTelemetry(url?: string): void {
  const otelUrl = url ?? ANALYTICS.otelUrl;
  if (!otelUrl) return;
  if (initialized) return;
  initialized = true;

  const provider = new WebTracerProvider({
    spanProcessors: [
      new BatchSpanProcessor(new OTLPTraceExporter({ url: `${otelUrl}/v1/traces` })),
    ],
  });
  provider.register({ contextManager: new ZoneContextManager() });

  // Never trace the telemetry endpoints themselves (avoids feedback loops).
  const ignoreUrls: Array<string | RegExp> = [otelUrl, /\/v1\/(traces|logs)$/];

  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({ ignoreUrls }),
      new XMLHttpRequestInstrumentation({ ignoreUrls }),
      new UserInteractionInstrumentation({ eventNames: ["click"] }),
    ],
  });
}
