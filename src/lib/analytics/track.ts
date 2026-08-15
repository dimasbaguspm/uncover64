import { trackUmami } from "./umami";

/** Product events (encode/decode/downscale) → Umami. */
export function trackEvent(name: string, props?: Record<string, unknown>): void {
  trackUmami(name, props);
}
