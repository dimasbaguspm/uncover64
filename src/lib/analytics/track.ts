import { trackUmami, umamiVersion } from "./umami";
import { ANALYTICS_PROVIDER } from "./provider";

export type TrackAttrs = Record<string, unknown>;

/**
 * Consumer-facing event API: `trackEvent("page loaded", { path })`.
 * Enriches every event with provider/app/environment metadata before dispatch,
 * so consumers stay decoupled from the active analytics provider.
 */
export function trackEvent(name: string, attrs?: TrackAttrs): void {
  const enriched: TrackAttrs = {
    provider: ANALYTICS_PROVIDER,
    providerVersion: umamiVersion(),
    appVersion: import.meta.env.VITE_APP_VERSION ?? "",
    environment: import.meta.env.MODE,
    page: typeof location !== "undefined" ? location.pathname : "",
    ...attrs,
  };

  switch (ANALYTICS_PROVIDER) {
    case "umami":
      trackUmami(name, enriched);
      break;
  }
}
