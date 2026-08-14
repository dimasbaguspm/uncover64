import type { LogContext } from "@grafana/faro-web-sdk";

type FaroModule = typeof import("@grafana/faro-web-sdk");

let faroModule: FaroModule | null | undefined;

async function getFaroModule(): Promise<FaroModule | null> {
  if (faroModule === undefined) {
    try {
      faroModule = await import("@grafana/faro-web-sdk");
    } catch {
      faroModule = null;
    }
  }
  return faroModule;
}

function toLogContext(props?: Record<string, unknown>): LogContext | undefined {
  if (!props) return undefined;
  return Object.fromEntries(Object.entries(props).map(([k, v]) => [k, String(v)]));
}

export async function trackEvent(name: string, props?: Record<string, unknown>): Promise<void> {
  const mod = await getFaroModule();
  mod?.faro.api.pushLog([name], {
    level: mod.LogLevel.INFO,
    context: toLogContext(props),
  });
}
