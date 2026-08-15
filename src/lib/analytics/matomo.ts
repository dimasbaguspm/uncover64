import { ANALYTICS } from "../../constants/analytics";

declare global {
  interface Window {
    _paq?: unknown[][];
  }
}

export function initMatomo(): void {
  const url = ANALYTICS.matomoUrl;
  if (!url) return;
  const siteId = ANALYTICS.matomoSiteId || "1";
  const _paq = (window._paq = window._paq || []);
  // Privacy-first: cookie-less tracking
  _paq.push(["disableCookies"]);
  _paq.push(["setTrackerUrl", `${url}/matomo.php`]);
  _paq.push(["setSiteId", siteId]);
  _paq.push(["trackPageView"]);
  _paq.push(["enableLinkTracking"]);

  const g = document.createElement("script");
  g.async = true;
  g.src = `${url}/matomo.js`;
  document.getElementsByTagName("script")[0].parentNode?.insertBefore(g, document.body);
}

export function trackMatomoEvent(category: string, action: string, name?: string): void {
  window._paq?.push(["trackEvent", category, action, name ?? ""]);
}
