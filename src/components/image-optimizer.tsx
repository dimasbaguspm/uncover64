import { clsx } from "clsx";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DownscaleResult } from "@/lib/types";
import { IMAGE_DEFAULTS, QUALITY_MAX, QUALITY_MIN, QUALITY_STEP } from "@/constants/image";
import { useEncoder } from "@/hooks/use-encoder";
import { useObjectUrl } from "@/hooks/use-object-url";
import { formatBytes, savingsPercent } from "@/lib/utils/format";
import { ExportBar } from "./export-bar";
import { MaxWidthSelect } from "./max-width-select";
import { ErrorBanner, Spinner, btnPrimary } from "./ui";

export function ImageOptimizer({
  bytes,
  mime,
  originalSize,
  originalDims,
}: {
  bytes: Uint8Array;
  mime: string;
  originalSize: number;
  originalDims: { width: number; height: number };
}) {
  const { t } = useTranslation();
  const [maxWidth, setMaxWidth] = useState(IMAGE_DEFAULTS.maxWidth);
  const [quality, setQuality] = useState(IMAGE_DEFAULTS.quality);
  const [format, setFormat] = useState<"jpeg" | "webp">(IMAGE_DEFAULTS.format);
  const [down, setDown] = useState<DownscaleResult | null>(null);
  const { downscale, busy, error } = useEncoder();

  const previewUrl = useObjectUrl(down ? down.bytes : null, down?.mime ?? "");

  const run = async () => {
    const res = await downscale(bytes.slice().buffer, mime, {
      maxWidth,
      quality,
      format,
    });
    if (res) setDown(res);
  };

  const savings = down ? savingsPercent(down.bytes.byteLength, originalSize) : 0;

  return (
    <div className="rounded-lg border border-edge bg-well p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-accent uppercase">
        {t("result.optimize")}
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MaxWidthSelect value={maxWidth} onChange={setMaxWidth} />
        <label className="block">
          <span className="mb-1 block text-xs text-faint">{t("common.format")}</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as "jpeg" | "webp")}
            className="w-full rounded-lg border border-edge bg-surface-2 px-2 py-2 text-sm text-ink"
          >
            <option value="jpeg">JPEG</option>
            <option value="webp">WebP</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-faint">
            {t("common.quality")} · {Math.round(quality * 100)}%
          </span>
          <input
            type="range"
            min={QUALITY_MIN}
            max={QUALITY_MAX}
            step={QUALITY_STEP}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className={clsx(btnPrimary, "w-full")}
          >
            {busy ? <Spinner /> : t("result.reencode")}
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint">
        {t("result.original", {
          width: originalDims.width,
          height: originalDims.height,
          size: formatBytes(originalSize),
        })}
      </p>

      <ErrorBanner message={error ?? ""} />

      {down && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <img
              src={previewUrl ?? undefined}
              alt="Optimized preview"
              className="max-h-48 rounded-lg border border-edge"
            />
            <div className="text-sm">
              <p className="text-ink">
                {down.width}×{down.height} · {formatBytes(down.bytes.byteLength)}
              </p>
              <p className={clsx("mt-1 font-medium", savings > 0 ? "text-accent" : "text-warn")}>
                {savings > 0 ? t("result.savedPct", { savings }) : t("result.noSavings")}
              </p>
            </div>
          </div>
          <ExportBar base64={down.base64} mime={down.mime} compressed={null} />
        </div>
      )}
    </div>
  );
}
