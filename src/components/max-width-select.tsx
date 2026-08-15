import { useTranslation } from "react-i18next";
import { IMAGE_MAX_WIDTHS } from "@/constants/image";

export function MaxWidthSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-faint">{t("result.maxWidth")}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-edge bg-surface-2 px-2 py-2 text-sm text-ink"
      >
        {IMAGE_MAX_WIDTHS.map((w) => (
          <option key={w} value={w}>
            {w}px
          </option>
        ))}
      </select>
    </label>
  );
}
