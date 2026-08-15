import { sendOtlpLog } from "./otel";

export function trackEvent(name: string, props?: Record<string, unknown>): void {
  void sendOtlpLog(name, "info", props);
}
