import type { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base";
import { SimpleSpanProcessor, WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { beforeEach, describe, expect, it } from "vitest";
import { __telemetryReset, initTelemetry } from "./telemetry";

beforeEach(() => __telemetryReset());

describe("initTelemetry", () => {
  it("is a no-op without a collector URL", () => {
    expect(() => initTelemetry("")).not.toThrow();
    expect(() => initTelemetry(undefined)).not.toThrow();
  });

  it("boots the SDK with a collector URL without throwing", () => {
    expect(() => initTelemetry("https://otel.example.dev/v1/traces")).not.toThrow();
  });

  it("assigns service.name/version to exported spans via the configured resource", () => {
    const spans: ReadableSpan[] = [];
    const exporter: SpanExporter = {
      export: (batch) => {
        spans.push(...batch);
        return Promise.resolve({ code: 0 });
      },
      shutdown: () => Promise.resolve(),
    };

    const provider = new WebTracerProvider({
      resource: resourceFromAttributes({
        "service.name": "uncover64",
        "service.version": import.meta.env.VITE_APP_VERSION ?? "",
      }),
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });
    provider.register();
    provider.getTracer("test").startSpan("ping").end();

    expect(spans.length).toBe(1);
    expect(spans[0].resource.attributes["service.name"]).toBe("uncover64");
    expect(spans[0].resource.attributes["service.version"]).toBe(
      import.meta.env.VITE_APP_VERSION ?? "",
    );
  });
});
