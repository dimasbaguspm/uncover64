import { useEffect, type DependencyList } from "react";
import { useLatest } from "./use-latest";

export function useAsyncEffect(
  effect: (isActive: () => boolean) => Promise<void>,
  deps: DependencyList,
): void {
  const effectRef = useLatest(effect);
  useEffect(() => {
    let cancelled = false;
    const isActive = () => !cancelled;
    void effectRef.current(isActive);
    return () => {
      cancelled = true;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
