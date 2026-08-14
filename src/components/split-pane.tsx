import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export function SplitPane({
  left,
  right,
  initialRatio = 0.7,
  minRatio = 0.3,
  maxRatio = 0.85,
}: {
  left: ReactNode;
  right: ReactNode;
  initialRatio?: number;
  minRatio?: number;
  maxRatio?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [ratio, setRatio] = useState(initialRatio);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0) return;
      const next = (e.clientX - rect.left) / rect.width;
      setRatio(Math.min(maxRatio, Math.max(minRatio, next)));
    },
    [minRatio, maxRatio],
  );

  const stop = useCallback(() => {
    draggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const start = useCallback(() => {
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stop);
    };
  }, [onPointerMove, stop]);

  return (
    <div ref={containerRef} className="relative flex min-h-0 w-full flex-1 overflow-hidden">
      <div className="relative min-w-0 overflow-hidden" style={{ width: `${ratio * 100}%` }}>
        <div className="absolute inset-0">{left}</div>
      </div>
      <div
        onPointerDown={start}
        role="separator"
        aria-orientation="vertical"
        title="Drag to resize"
        className="group absolute top-0 bottom-0 z-10 w-3 -translate-x-1/2 cursor-col-resize"
        style={{ left: `${ratio * 100}%` }}
      >
        <div className="relative flex h-full w-full items-center justify-center">
          <div className="absolute top-0 bottom-0 w-0.5 bg-edge transition-colors group-hover:bg-accent/60" />
          <div className="relative h-10 w-1 rounded-full bg-edge transition-colors group-hover:bg-accent" />
        </div>
      </div>
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div className="absolute inset-0">{right}</div>
      </div>
    </div>
  );
}
