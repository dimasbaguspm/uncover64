import { ANALYTICS } from "../../constants/analytics";

export function initUmami(): void {
  const { umamiUrl, umamiWebsiteId } = ANALYTICS;
  if (!umamiUrl || !umamiWebsiteId) return;
  const script = document.createElement("script");
  script.async = true;
  script.defer = true;
  script.src = `${umamiUrl}/script.js`;
  script.setAttribute("data-website-id", umamiWebsiteId);
  document.head.appendChild(script);
}

type UmamiTracker = {
  track: (name: string, props?: Record<string, unknown>) => void;
};

export function trackUmami(name: string, props?: Record<string, unknown>): void {
  const umami = (window as unknown as { umami?: UmamiTracker }).umami;
  umami?.track(name, props);
}
