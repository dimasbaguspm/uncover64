import { useEffect, useState, type ReactNode } from "react";
import { trackEvent } from "../lib/analytics/track";
import { logInfo } from "../lib/analytics/otel";
import { ANALYTICS } from "../constants/analytics";
import { initWorker } from "../lib/worker-client";
import { tryCatch } from "../lib/utils/try-catch";

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
    void tryCatch(
      async () => {
        if (ANALYTICS.otelUrl) {
          await tryCatch(() =>
            import("../lib/analytics/telemetry").then(({ initTelemetry }) => initTelemetry()),
          );
        }
        await Promise.race([
          initWorker(),
          new Promise((resolve) => setTimeout(resolve, INIT_TIMEOUT_MS)),
        ]);
      },
      {
        onFinished: () => {
          if (mounted) {
            trackEvent("page_loaded");
            logInfo("app booted", { version: import.meta.env.VITE_APP_VERSION ?? "" });
            setReady(true);
          }
        },
      },
    );
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
