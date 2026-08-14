import { useCallback, useState } from "react";

export function useClipboard(timeoutMs = 1500) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), timeoutMs);
      } catch {
        setCopied(false);
      }
    },
    [timeoutMs],
  );

  return { copied, copy };
}
