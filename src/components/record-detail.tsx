import { ArrowDown, ArrowUp } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { dash, sort } from "radash";
import { COMPRESSION_LABELS, QUALITY_ORIGINAL } from "@/constants/compression";
import type { CompressionRecord } from "@/lib/db";
import type { CompressFormat } from "@/lib/types";
import { downloadTextFile } from "@/lib/utils/download";
import { variationKey } from "@/lib/variation";
import { VariationRow } from "./variation-row";

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

// eslint-disable-next-line react/only-export-components -- pure helper shared with compression-page
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
  const { t } = useTranslation();
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
    const best = sort(
      rows.filter((r) => r.algorithm),
      (r) => r.byteLength,
    )[0];
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
          {sortedRows.map((row) => (
            <VariationRow
              key={row.id}
              variation={row}
              selected={row.id === selectedId}
              recommended={row.id === bestId}
              onSelect={onSelect}
              base64={base64}
              base64Loading={base64Loading}
              originalSize={record.rawSizeBytes}
              onDownload={() => base64 && downloadTextFile(downloadName(record, row), base64)}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
