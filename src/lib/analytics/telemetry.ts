import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { UserInteractionInstrumentation } from "@opentelemetry/instrumentation-user-interaction";
import { XMLHttpRequestInstrumentation } from "@opentelemetry/instrumentation-xml-http-request";
import { WebTracerProvider, BatchSpanProcessor } from "@opentelemetry/sdk-trace-web";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ANALYTICS } from "@/constants/analytics";

let initialized = false;
let activeProvider: WebTracerProvider | null = null;

/** Test-only hook: allow re-initialization between tests. */
export function __telemetryReset(): void {
  initialized = false;
  activeProvider = null;
}

/** Test-only hook: flush pending spans so tests can observe the export. */
export function __telemetryFlush(): Promise<void> {
  return activeProvider?.forceFlush() ?? Promise.resolve();
}

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
    resource: resourceFromAttributes({
      "service.name": "uncover64",
      "service.version": import.meta.env.VITE_APP_VERSION ?? "",
    }),
    spanProcessors: [
      new BatchSpanProcessor(new OTLPTraceExporter({ url: `${otelUrl}/v1/traces` })),
    ],
  });
  activeProvider = provider;
  provider.register({ contextManager: new ZoneContextManager() });

  // Never trace the telemetry endpoints themselves (avoids feedback loops) or
  // other first-party beacons that add noise.
  const ignoreUrls: Array<string | RegExp> = [
    otelUrl,
    /\/v1\/(traces|logs)$/,
    /cdn-cgi\/rum/, // Cloudflare RUM beacon
    /analytics\.dimasbaguspm\.dev/, // Umami beacon
  ];

  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({ ignoreUrls }),
      new XMLHttpRequestInstrumentation({ ignoreUrls }),
      new UserInteractionInstrumentation({ eventNames: ["click"] }),
    ],
  });
}
