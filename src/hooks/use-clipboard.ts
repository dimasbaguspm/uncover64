import { useCallback, useState } from "react";
import { tryCatch } from "../lib/utils/try-catch";
import { logInfo, logWarn } from "../lib/analytics/otel";

export function useClipboard(timeoutMs = 1500) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (value: string) => {
      await tryCatch(
        async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          logInfo("clipboard copy", { length: value.length });
          setTimeout(() => setCopied(false), timeoutMs);
        },
        {
          log: false,
          onError: (err) => {
            setCopied(false);
            logWarn("clipboard copy failed", {
              length: value.length,
              error: err instanceof Error ? err.message : String(err),
            });
          },
        },
      );
    },
    [timeoutMs],
  );

  return { copied, copy };
}
