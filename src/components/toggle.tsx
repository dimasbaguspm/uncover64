import { clsx } from "clsx";

export interface ToggleOption<T extends string> {
  id: T;
  label: string;
}

export function Toggle<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: ToggleOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center rounded bg-surface-2 p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={clsx(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            value === o.id ? "bg-[var(--edge)] text-ink" : "text-dim hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
