// src/hooks/use-latest.ts
import { useLayoutEffect, useRef } from "react";

export function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
