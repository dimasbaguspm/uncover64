import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadOtel() {
  vi.resetModules();
  const mod = await import("./otel");
  return mod as typeof import("./otel");
}

function recordOf(body: Record<string, any>) {
  return body.resourceLogs[0].scopeLogs[0].logRecords[0];
}

beforeEach(() => {
  vi.stubEnv("VITE_OTEL_COLLECTOR_URL", "");
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("otel", () => {
  it("does nothing when no collector url is configured", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const mod = await loadOtel();

    await mod.logError(new Error("boom"), "test");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports an error as an OTLP log record", async () => {
    vi.stubEnv("VITE_OTEL_COLLECTOR_URL", "https://otel.test");
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);
    const mod = await loadOtel();

    await mod.logError(new Error("boom"), "render error", { componentStack: "at Foo" });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://otel.test/v1/logs");
    expect(init.method).toBe("POST");

    const body = JSON.parse(init.body);
    expect(body.resourceLogs[0].resource.attributes).toContainEqual({
      key: "service.name",
      value: { stringValue: "uncover64" },
    });

    const rec = recordOf(body);
    expect(rec.severityNumber).toBe(17);
    expect(rec.severityText).toBe("ERROR");
    expect(rec.body.stringValue).toBe("render error");

    const attrs = Object.fromEntries(rec.attributes.map((a) => [a.key, a.value]));
    expect(attrs).toMatchObject({
      errorName: { stringValue: "Error" },
      errorMessage: { stringValue: "boom" },
      componentStack: { stringValue: "at Foo" },
      sessionId: { stringValue: expect.any(String) },
    });
  });

  it("encodes attribute values by their js type", async () => {
    vi.stubEnv("VITE_OTEL_COLLECTOR_URL", "https://otel.test");
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);
    const mod = await loadOtel();

    await mod.logInfo("metrics", { count: 5, ratio: 1.5, flag: true, obj: { a: 1 } });

    const rec = recordOf(JSON.parse(fetchSpy.mock.calls[0][1].body));
    const attrs = Object.fromEntries(rec.attributes.map((a) => [a.key, a.value]));
    expect(attrs).toMatchObject({
      count: { intValue: "5" },
      ratio: { doubleValue: 1.5 },
      flag: { stringValue: "true" },
      obj: { stringValue: '{"a":1}' },
    });
    expect(rec.severityNumber).toBe(9);
  });

  it("retries once after a transient failure", async () => {
    vi.stubEnv("VITE_OTEL_COLLECTOR_URL", "https://otel.test");
    const fetchSpy = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);
    const mod = await loadOtel();

    vi.useFakeTimers();
    const promise = mod.logError(new Error("boom"), "retry me");
    await vi.advanceTimersByTimeAsync(600);
    await promise;

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("exposes no active trace context by default", async () => {
    const mod = await loadOtel();
    expect(mod.currentTrace()).toBeNull();
  });
});
