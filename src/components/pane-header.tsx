import type { ReactNode } from "react";

export function PaneHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-edge px-3 py-1.5">
      <p className="text-xs font-medium tracking-wide text-faint uppercase">{title}</p>
      {right}
    </div>
  );
}
