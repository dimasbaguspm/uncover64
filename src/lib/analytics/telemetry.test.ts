import { describe, expect, it } from "vitest";
import { initTelemetry } from "./telemetry";

describe("initTelemetry", () => {
  it("is a no-op without a collector URL", () => {
    expect(() => initTelemetry("")).not.toThrow();
    expect(() => initTelemetry(undefined)).not.toThrow();
  });

  it("boots the SDK with a collector URL without throwing", () => {
    expect(() => initTelemetry("https://otel.example.dev")).not.toThrow();
  });
});
