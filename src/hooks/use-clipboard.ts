import { useCallback, useState } from "react";
import { tryCatch } from "../lib/utils/try-catch";

export function useClipboard(timeoutMs = 1500) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (value: string) => {
      await tryCatch(
        async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), timeoutMs);
        },
        { log: false, onError: () => setCopied(false) },
      );
    },
    [timeoutMs],
  );

  return { copied, copy };
}
