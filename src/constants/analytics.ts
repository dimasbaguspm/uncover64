export const ANALYTICS = {
  otelUrl: import.meta.env.VITE_FARO_COLLECTOR_URL,
  umamiUrl: import.meta.env.VITE_UMAMI_URL,
  umamiWebsiteId: import.meta.env.VITE_UMAMI_WEBSITE_ID,
} as const;
