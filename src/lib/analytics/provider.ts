/**
 * The active analytics provider. Swap this constant to migrate providers —
 * consumers only ever call `trackEvent(name, attrs)`.
 */
export const ANALYTICS_PROVIDER = "umami" as const;

export type AnalyticsProvider = typeof ANALYTICS_PROVIDER;
