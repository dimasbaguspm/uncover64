/**
 * Umami tracker — the script is loaded statically in index.html
 * (data-website-id), which auto-tracks page views. This module only handles
 * custom events, which the script does not track by itself.
 */

type UmamiTracker = {
  track: (name: string, props?: Record<string, unknown>) => void;
  version?: string;
};

export function trackUmami(name: string, props?: Record<string, unknown>): void {
  const umami = (window as unknown as { umami?: UmamiTracker }).umami;
  umami?.track(name, props);
}

export function umamiVersion(): string {
  return (window as unknown as { umami?: UmamiTracker }).umami?.version ?? "unknown";
}
