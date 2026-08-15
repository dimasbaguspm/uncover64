import { useEffect, useState, type ReactNode } from "react";
import { initUmami } from "../lib/analytics/umami";
import { trackEvent } from "../lib/analytics/track";
import { ANALYTICS } from "../constants/analytics";
import { initWorker } from "../lib/worker-client";

const INIT_TIMEOUT_MS = 5000;

/**
 * Boots async dependencies (analytics, core worker) and renders children once
 * ready. Shows a global loading state meanwhile so consumers can assume the
 * bundle and deps are loaded.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        initUmami();
        if (ANALYTICS.otelUrl) {
          await import("../lib/analytics/faro").then(({ initFaro }) => initFaro()).catch(() => {});
        }
        await Promise.race([
          initWorker(),
          new Promise((resolve) => setTimeout(resolve, INIT_TIMEOUT_MS)),
        ]);
      } catch {
        /* boot must never block the app */
      }
      if (mounted) {
        trackEvent("page_loaded");
        setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <img src="/uncover64.svg" alt="" className="size-14" />
          <span className="inline-block size-5 animate-spin rounded-full border-2 border-edge border-t-accent" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
