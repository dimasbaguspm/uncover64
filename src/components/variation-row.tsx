import { clsx } from "clsx";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trackEvent } from "@/lib/analytics/track";
import { formatBytes, savingsPercent } from "@/lib/utils/format";
import { CopyButton, Spinner } from "./ui";
import type { VariationOption } from "./record-detail";

export function VariationRow({
  variation,
  selected,
  recommended,
  onSelect,
  base64,
  base64Loading,
  originalSize,
  onDownload,
}: {
  variation: VariationOption;
  selected: boolean;
  recommended: boolean;
  onSelect: (id: string) => void;
  base64: string | null;
  base64Loading: boolean;
  originalSize: number;
  onDownload: () => void;
}) {
  const { t, i18n } = useTranslation();
  const savings = variation.algorithm ? savingsPercent(variation.byteLength, originalSize) : 0;
  return (
    <button
      type="button"
      onClick={() => {
        trackEvent("compression_select", { id: variation.id, label: variation.label });
        onSelect(variation.id);
      }}
      className={clsx(
        "flex w-full flex-col rounded border px-3 py-3 text-left transition-colors",
        selected ? "border-accent/60 bg-accent/10" : "border-transparent hover:bg-surface-2",
      )}
    >
      <span className="flex w-full flex-wrap items-center gap-3">
        <span
          className={clsx(
            "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
            selected ? "border-accent" : "border-edge-strong",
          )}
        >
          {selected && <span className="size-2 rounded-full bg-accent" />}
        </span>
        <span className={clsx("text-sm font-medium", selected ? "text-accent" : "text-ink")}>
          {variation.label}
        </span>
        {recommended && (
          <span className="flex shrink-0 items-center gap-0.5 rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
            ★ {t("record.recommended")}
          </span>
        )}
        <span className="ml-auto flex shrink-0 flex-col items-end">
          <span className="text-sm font-medium text-ink">{formatBytes(variation.byteLength)}</span>
          <span className="text-xs text-faint">
            {t("common.chars", {
              count: variation.base64Length.toLocaleString(i18n.language),
            })}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {selected &&
            (base64Loading ? (
              <Spinner />
            ) : base64 ? (
              <>
                <CopyButton value={base64} className="!px-1.5 !py-1 text-xs" />
                <button
                  type="button"
                  onClick={onDownload}
                  aria-label={t("record.download")}
                  className="rounded border border-edge bg-surface-2 p-1 text-dim transition-colors hover:border-edge-strong hover:text-ink"
                >
                  <Download className="size-3.5" aria-hidden />
                </button>
              </>
            ) : null)}
        </span>
      </span>
      {variation.algorithm && (
        <span className="flex w-full items-center gap-1 pl-7 text-[10px] text-faint">
          <span>
            {t("record.sizeLine", {
              original: formatBytes(originalSize),
              size: formatBytes(variation.byteLength),
            })}
          </span>
          {savings > 0 && <span className="text-accent">{t("record.savedTag", { savings })}</span>}
          {variation.ms !== undefined && (
            <span>{t("record.msTag", { ms: variation.ms.toFixed(0) })}</span>
          )}
        </span>
      )}
    </button>
  );
}
