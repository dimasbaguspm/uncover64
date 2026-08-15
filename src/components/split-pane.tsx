import { clsx } from "clsx";
import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";

function loadRatio(storageKey: string): number | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function saveRatio(storageKey: string, v: number) {
  try {
    localStorage.setItem(storageKey, String(v));
  } catch {
    /* ignore */
  }
}

export function SplitPane({
  left,
  right,
  initialRatio = 0.6,
  minRatio = 0.25,
  maxRatio = 0.85,
  storageKey,
}: {
  left: ReactNode;
  right: ReactNode;
  initialRatio?: number;
  minRatio?: number;
  maxRatio?: number;
  storageKey?: string;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const [dRatio, setDRatio] = useState<number>(() => {
    if (!storageKey) return initialRatio;
    return loadRatio(`${storageKey}\u0000d`) ?? initialRatio;
  });
  const [mRatio, setMRatio] = useState<number>(() => {
    if (!storageKey) return initialRatio;
    return loadRatio(`${storageKey}\u0000m`) ?? initialRatio;
  });

  const ratio = isDesktop ? dRatio : mRatio;
  const setRatio = isDesktop ? setDRatio : setMRatio;

  const persist = useCallback(() => {
    if (!storageKey) return;
    saveRatio(`${storageKey}\u0000d`, dRatio);
    saveRatio(`${storageKey}\u0000m`, mRatio);
  }, [storageKey, dRatio, mRatio]);

  const clamp = useCallback(
    (v: number) => Math.min(maxRatio, Math.max(minRatio, v)),
    [minRatio, maxRatio],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      draggingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      document.body.style.cursor = isDesktop ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    },
    [isDesktop],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const raw = isDesktop
        ? (e.clientX - rect.left) / rect.width
        : (e.clientY - rect.top) / rect.height;
      setRatio(clamp(raw));
    },
    [isDesktop, setRatio, clamp],
  );

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    persist();
  }, [persist]);

  const firstDim = isDesktop ? "width" : "height";
  const dividerPos = isDesktop ? "left" : "top";

  return (
    <div
      ref={containerRef}
      className={clsx(
        "relative flex min-h-0 w-full flex-1 overflow-hidden",
        isDesktop ? "flex-row" : "flex-col",
      )}
    >
      <div
        className="relative min-w-0 min-h-0 overflow-hidden"
        style={{ [firstDim]: `${ratio * 100}%` } as CSSProperties}
      >
        <div className="absolute inset-0">{left}</div>
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="separator"
        aria-orientation={isDesktop ? "vertical" : "horizontal"}
        aria-label="Drag to resize"
        title="Drag to resize"
        className={clsx(
          "group absolute z-10 flex items-center justify-center touch-none",
          isDesktop
            ? "top-0 bottom-0 w-3 -translate-x-1/2 cursor-col-resize"
            : "left-0 right-0 h-3 -translate-y-1/2 cursor-row-resize",
        )}
        style={{ [dividerPos]: `${ratio * 100}%` } as CSSProperties}
      >
        <div
          className={clsx(
            "absolute bg-edge transition-colors group-hover:bg-accent/60",
            isDesktop ? "top-0 bottom-0 w-0.5" : "left-0 right-0 h-0.5",
          )}
        />
        <div
          className={clsx(
            "relative rounded-full bg-edge transition-colors group-hover:bg-accent",
            isDesktop ? "h-10 w-1" : "h-1 w-10",
          )}
        />
      </div>
      <div className="relative min-w-0 min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0">{right}</div>
      </div>
    </div>
  );
}
