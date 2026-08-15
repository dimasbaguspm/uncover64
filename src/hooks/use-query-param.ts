import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { logDebug } from "../lib/analytics/otel";

export function useQueryParam(name: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(name);
  const set = useCallback(
    (next: string | null) => {
      logDebug("query param set", { name, value: next ?? null });
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === null) params.delete(name);
          else params.set(name, next);
          return params;
        },
        { replace: false },
      );
    },
    [name, setSearchParams],
  );
  return [value, set] as const;
}
