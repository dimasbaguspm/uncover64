import { useState } from "react";
import { ANALYTICS } from "@/constants/analytics";
import { logInfo } from "@/lib/analytics/otel";
import { trackEvent } from "@/lib/analytics/track";
import { tryCatch } from "@/lib/utils/try-catch";
import { initWorker } from "@/lib/worker-client";
import { useAsyncEffect } from "./use-async-effect";

/**
 * Boots async dependencies (analytics, core worker) and returns true once
 * ready, cancel-safe: unmounting before boot finishes skips telemetry and
 * never flips ready.
 */
export function useAppBoot(timeoutMs = 5000): boolean {
  const [ready, setReady] = useState(false);

  useAsyncEffect(
    async (isActive) => {
      await tryCatch(
        async () => {
          if (ANALYTICS.otelUrl) {
            await tryCatch(() =>
              import("@/lib/analytics/telemetry").then(({ initTelemetry }) => initTelemetry()),
            );
          }
          await Promise.race([
            initWorker(),
            new Promise((resolve) => setTimeout(resolve, timeoutMs)),
          ]);
        },
        {
          onFinished: () => {
            if (isActive()) {
              trackEvent("page_loaded");
              logInfo("app booted", { version: import.meta.env.VITE_APP_VERSION ?? "" });
              setReady(true);
            }
          },
        },
      );
    },
    [timeoutMs],
  );

  return ready;
}
