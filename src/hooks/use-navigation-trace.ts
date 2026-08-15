import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { currentTrace, logInfo } from "@/lib/analytics/otel";
import { trackEvent } from "@/lib/analytics/track";
import { maskUrl } from "@/lib/utils/mask";

// The click span is already ended when the navigation effect runs, so capture
// the active trace at click time and attach it to the navigate log.
let lastNavTrace: { traceId: string; spanId: string } | null = null;

/**
 * Correlates route changes with the click span that triggered them: captures
 * the active trace on any click and attaches it to the next page_navigate log.
 */
export function useNavigationTrace(): void {
  const location = useLocation();
  const prevRef = useRef(location.pathname);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = location.pathname;
    if (prev === location.pathname) return;
    const masked = maskUrl(location.pathname);
    const trace = lastNavTrace;
    lastNavTrace = null;
    trackEvent("page_navigate", { path: masked });
    logInfo("page navigate", {
      path: masked,
      traceId: trace?.traceId ?? "",
      spanId: trace?.spanId ?? "",
    });
  }, [location.pathname]);

  useEffect(() => {
    const onCapture = () => {
      lastNavTrace = currentTrace();
    };
    document.addEventListener("click", onCapture, true);
    return () => document.removeEventListener("click", onCapture, true);
  }, []);
}
