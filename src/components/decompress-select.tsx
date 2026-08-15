import { useTranslation } from "react-i18next";
import type { DecompressOption } from "@/lib/types";
import { DECOMPRESS_OPTIONS } from "@/constants/compression";

function optionLabel(id: DecompressOption, t: (key: string) => string): string {
  if (id === null) return t("decode.off");
  if (id === "auto") return t("decode.auto");
  return id[0].toUpperCase() + id.slice(1);
}

export function DecompressSelect({
  value,
  onChange,
}: {
  value: DecompressOption;
  onChange: (v: DecompressOption) => void;
}) {
  const { t } = useTranslation();
  return (
    <select
      value={String(value)}
      onChange={(e) => onChange(e.target.value as DecompressOption)}
      className="rounded border border-edge bg-surface-2 px-2 py-1 text-xs text-ink focus:border-accent/60 focus:outline-none"
      aria-label={t("decode.decompress")}
    >
      {DECOMPRESS_OPTIONS.map((o) => (
        <option key={String(o.id)} value={String(o.id)}>
          {optionLabel(o.id, t)}
        </option>
      ))}
    </select>
  );
}
