import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import type { CompressFormat } from "@/lib/types";

export function QualityOption({
  algo,
  quality,
  selected,
  onChange,
}: {
  algo: CompressFormat;
  quality: number;
  selected: boolean;
  onChange: (key: string) => void;
}) {
  const { t } = useTranslation();
  const key = `${algo}:${quality}`;
  return (
    <label
      className={clsx(
        "flex cursor-pointer items-center gap-1.5 rounded border px-2 py-1 text-xs transition-colors",
        selected ? "border-accent/60 bg-accent/10 text-accent" : "border-edge hover:bg-surface-2",
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onChange(key)}
        className="accent-[var(--accent)]"
      />
      <span className="flex flex-col items-center leading-tight">
        <span>{quality}%</span>
        <span className="text-[10px] text-faint">
          {t("record.reduced", { pct: 100 - quality })}
        </span>
      </span>
    </label>
  );
}
