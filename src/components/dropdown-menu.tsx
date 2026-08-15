import { clsx } from "clsx";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function DropdownMenu({
  trigger,
  label,
  side = "bottom",
  align = "end",
  children,
}: {
  trigger: ReactNode;
  label: string;
  side?: "top" | "bottom";
  align?: "start" | "end";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded p-1.5 text-dim transition-colors hover:bg-surface-2 hover:text-ink"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={clsx(
            "absolute z-40 min-w-40 rounded-lg border border-edge bg-surface p-1 shadow-[var(--shadow)]",
            side === "top" ? "bottom-full mb-1" : "top-full mt-1",
            align === "end" ? "right-0" : "left-0",
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-ink transition-colors hover:bg-surface-2"
    >
      {children}
    </button>
  );
}

export function NestedMenuItem({
  label,
  open,
  onOpen,
  side = "left",
  children,
}: {
  label: ReactNode;
  open: boolean;
  onOpen: (open: boolean) => void;
  side?: "left" | "right";
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          onOpen(!open);
        }}
        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-ink transition-colors hover:bg-surface-2"
      >
        <ChevronRight className="size-4 text-dim" aria-hidden />
        {label}
      </button>
      {open && (
        <div
          role="menu"
          className={clsx(
            "absolute top-0 z-50 min-w-40 rounded-lg border border-edge bg-surface p-1 shadow-[var(--shadow)]",
            side === "left" ? "right-full mr-1" : "left-full ml-1",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
