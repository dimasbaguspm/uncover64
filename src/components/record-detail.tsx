import { clsx } from "clsx";
import { ArrowDown, ArrowUp, Download } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { dash, sort } from "radash";
import { COMPRESSION_LABELS, QUALITY_ORIGINAL } from "@/constants/compression";
import type { CompressionRecord } from "@/lib/db";
import type { CompressFormat } from "@/lib/types";
import { formatBytes, savingsPercent } from "@/lib/utils/format";
import { downloadBase64 } from "@/lib/utils/download";
import { variationKey } from "@/lib/variation";
import { trackEvent } from "@/lib/analytics/track";
import { CopyButton, Spinner } from "./ui";

export interface VariationOption {
  id: string;
  label: string;
  algorithm: CompressFormat | null;
  quality?: number;
  byteLength: number;
  base64Length: number;
  ms?: number;
}

function downloadName(record: CompressionRecord, row: VariationOption): string {
  const parts = ["uncover64", dash(record.name)];
  if (row.algorithm) {
    parts.push(dash(COMPRESSION_LABELS[row.algorithm]));
    if (row.algorithm !== "lz" && row.quality !== undefined) parts.push(String(row.quality));
  }
  return `${parts.join("_")}.b64`;
}

export function recordVariations(record: CompressionRecord, t: TFunction): VariationOption[] {
  return [
    {
      id: "raw",
      label: t("record.raw"),
      algorithm: null,
      quality: QUALITY_ORIGINAL,
      byteLength: record.rawSizeBytes,
      base64Length: record.rawBase64Length,
    },
    ...record.variations.map((v) => ({
      id: variationKey(v.algorithm, v.quality),
      label:
        v.algorithm === "lz"
          ? COMPRESSION_LABELS.lz
          : t("record.variationLabel", {
              algo: COMPRESSION_LABELS[v.algorithm],
              quality: v.quality,
              reduced: 100 - v.quality,
            }),
      algorithm: v.algorithm,
      quality: v.quality,
      byteLength: v.byteLength,
      base64Length: v.base64Length,
      ms: v.ms,
    })),
  ];
}

type SortKey = "size" | "quality" | "algorithm";

export const RecordDetail = memo(function RecordDetail({
  record,
  selectedId,
  onSelect,
  base64,
  base64Loading,
}: {
  record: CompressionRecord;
  selectedId: string;
  onSelect: (variation: VariationOption) => void;
  base64: string | null;
  base64Loading: boolean;
}) {
  const { t, i18n } = useTranslation();
  const rows = useMemo(() => recordVariations(record, t), [record, t]);
  const [sortKey, setSortKey] = useState<SortKey>("size");
  const [asc, setAsc] = useState(true);

  const sortedRows = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "size") cmp = a.byteLength - b.byteLength;
      else if (sortKey === "quality") {
        cmp = (a.quality ?? 0) - (b.quality ?? 0) || a.label.localeCompare(b.label);
      } else {
        cmp = a.label.localeCompare(b.label) || a.byteLength - b.byteLength;
      }
      return asc ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, asc]);

  const bestId = useMemo(() => {
    const best = sort(rows.filter((r) => r.algorithm), (r) => r.byteLength)[0];
    return best?.id ?? null;
  }, [rows]);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium tracking-wide text-faint uppercase">
            {t("record.variations")}
          </p>
          <div className="flex items-center gap-1">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label={t("record.sort")}
              className="rounded border border-edge bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink focus:border-accent/60 focus:outline-none"
            >
              <option value="size">{t("record.size")}</option>
              <option value="quality">{t("common.quality")}</option>
              <option value="algorithm">{t("record.algorithm")}</option>
            </select>
            <button
              type="button"
              onClick={() => setAsc((a) => !a)}
              aria-label={t("record.sortDir")}
              className="rounded border border-edge bg-surface-2 p-1 text-dim transition-colors hover:text-ink"
            >
              {asc ? (
                <ArrowUp className="size-3" aria-hidden />
              ) : (
                <ArrowDown className="size-3" aria-hidden />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {sortedRows.map((row) => {
            const selected = row.id === selectedId;
            const savings = row.algorithm ? savingsPercent(row.byteLength, record.rawSizeBytes) : 0;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  trackEvent("compression_select", { id: row.id, label: row.label });
                  onSelect(row);
                }}
                className={clsx(
                  "flex w-full flex-col rounded border px-3 py-3 text-left transition-colors",
                  selected
                    ? "border-accent/60 bg-accent/10"
                    : "border-transparent hover:bg-surface-2",
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
                  <span
                    className={clsx("text-sm font-medium", selected ? "text-accent" : "text-ink")}
                  >
                    {row.label}
                  </span>
                  {row.id === bestId && (
                    <span className="flex shrink-0 items-center gap-0.5 rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                      ★ {t("record.recommended")}
                    </span>
                  )}
                  <span className="ml-auto flex shrink-0 flex-col items-end">
                    <span className="text-sm font-medium text-ink">
                      {formatBytes(row.byteLength)}
                    </span>
                    <span className="text-xs text-faint">
                      {t("common.chars", {
                        count: row.base64Length.toLocaleString(i18n.language),
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
                            onClick={() => downloadBase64(downloadName(record, row), base64)}
                            aria-label={t("record.download")}
                            className="rounded border border-edge bg-surface-2 p-1 text-dim transition-colors hover:border-edge-strong hover:text-ink"
                          >
                            <Download className="size-3.5" aria-hidden />
                          </button>
                        </>
                      ) : null)}
                  </span>
                </span>
                {row.algorithm && (
                  <span className="flex w-full items-center gap-1 pl-7 text-[10px] text-faint">
                    <span>
                      {t("record.sizeLine", {
                        original: formatBytes(record.rawSizeBytes),
                        size: formatBytes(row.byteLength),
                      })}
                    </span>
                    {savings > 0 && (
                      <span className="text-accent">{t("record.savedTag", { savings })}</span>
                    )}
                    {row.ms !== undefined && (
                      <span>{t("record.msTag", { ms: row.ms.toFixed(0) })}</span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
