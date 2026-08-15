import { trackMatomoEvent } from "./matomo";

/** Product events (encode/decode/downscale) → Matomo. */
export function trackEvent(name: string, _props?: Record<string, unknown>): void {
  trackMatomoEvent("action", name);
}
