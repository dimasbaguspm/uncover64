export const ANALYTICS = {
  otelUrl: import.meta.env.VITE_FARO_COLLECTOR_URL,
  matomoUrl: import.meta.env.VITE_MATOMO_URL,
  matomoSiteId: import.meta.env.VITE_MATOMO_SITE_ID,
} as const;
