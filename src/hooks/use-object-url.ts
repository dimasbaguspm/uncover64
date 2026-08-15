import { useEffect, useMemo, useRef } from "react";
import { createObjectUrl, revokeObjectUrl } from "@/lib/utils/download";

export function useObjectUrl(bytes: Uint8Array | ArrayBuffer | null, mime: string): string | null {
  const url = useMemo(() => (bytes === null ? null : createObjectUrl(bytes, mime)), [bytes, mime]);
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    if (prevUrl.current && prevUrl.current !== url) revokeObjectUrl(prevUrl.current);
    prevUrl.current = url;
  }, [url]);

  useEffect(
    () => () => {
      if (prevUrl.current) revokeObjectUrl(prevUrl.current);
    },
    [],
  );

  return url;
}
