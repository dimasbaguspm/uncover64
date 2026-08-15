import { clsx } from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DecodeResult, DownscaleResult } from "@/lib/types";
import {
  IMAGE_DEFAULTS,
  IMAGE_MAX_WIDTHS,
  QUALITY_MAX,
  QUALITY_MIN,
  QUALITY_STEP,
} from "@/constants/image";
import { useWorker } from "@/providers/worker-provider";
import { formatBytes, prettyJson, savingsPercent } from "@/lib/utils/format";
import { createObjectUrl, downloadBlob, revokeObjectUrl } from "@/lib/utils/download";
import { ExportBar } from "./export-bar";
import { Badge, CodeBlock, CopyButton, ErrorBanner, Spinner, btn, btnPrimary } from "./ui";

function ImageOptimizer({
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
  const { downscale, busy, error } = useWorker();

  const previewUrl = useMemo(() => (down ? createObjectUrl(down.bytes, down.mime) : null), [down]);
  useEffect(() => {
    return () => {
      if (previewUrl) revokeObjectUrl(previewUrl);
    };
  }, [previewUrl]);

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
        <label className="block">
          <span className="mb-1 block text-xs text-faint">{t("result.maxWidth")}</span>
          <select
            value={maxWidth}
            onChange={(e) => setMaxWidth(Number(e.target.value))}
            className="w-full rounded-lg border border-edge bg-surface-2 px-2 py-2 text-sm text-ink"
          >
            {IMAGE_MAX_WIDTHS.map((w) => (
              <option key={w} value={w}>
                {w}px
              </option>
            ))}
          </select>
        </label>
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
              src={previewUrl!}
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

export function ResultView({
  result,
  showDownscale,
}: {
  result: DecodeResult;
  showDownscale?: boolean;
}) {
  const { t } = useTranslation();
  const [pretty, setPretty] = useState(true);

  const url = useMemo(
    () => (result.bytes.length ? createObjectUrl(result.bytes, result.info.mime) : null),
    [result],
  );
  useEffect(() => {
    return () => {
      if (url) revokeObjectUrl(url);
    };
  }, [url]);

  const isImage = ["png", "jpeg", "gif", "webp"].includes(result.info.kind);
  const isJson = result.info.kind === "json";
  const isPreviewable = isImage || result.info.kind === "pdf";

  const displayText = isJson && pretty ? prettyJson(result.text ?? "") : (result.text ?? "");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge info={result.info} />
        <span className="text-xs text-faint">
          {formatBytes(result.sizeBytes)}
          {result.image && ` · ${result.image.width}×${result.image.height}`}
        </span>
        {result.decompressed && (
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
            {t("decode.decompressed", { algo: result.decompressed })}
          </span>
        )}
      </div>

      {result.jwt && (
        <div className="space-y-3">
          <CodeBlock code={result.jwt.header} label={t("result.jwtHeader")} />
          <CodeBlock code={result.jwt.payload} label={t("result.jwtPayload")} />
        </div>
      )}

      {isImage && (
        <>
          <div className="flex items-start justify-center rounded-lg border border-edge bg-well p-4">
            <img src={url!} alt="Decoded image preview" className="max-h-96 rounded-lg" />
          </div>
          {showDownscale && result.image && (
            <ImageOptimizer
              bytes={result.bytes}
              mime={result.info.mime}
              originalSize={result.sizeBytes}
              originalDims={result.image}
            />
          )}
        </>
      )}

      {result.info.kind === "pdf" && (
        <iframe
          src={url!}
          title="PDF preview"
          className="h-96 w-full rounded-lg border border-edge bg-well"
        />
      )}

      {result.isUtf8 && result.info.kind !== "jwt" && !isPreviewable && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              {isJson && (
                <button
                  type="button"
                  onClick={() => setPretty((p) => !p)}
                  className={clsx(btn, "!px-2 !py-1 text-xs")}
                >
                  {pretty ? t("result.minify") : t("result.pretty")}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <CopyButton value={displayText} />
              <button
                type="button"
                onClick={() =>
                  downloadBlob(result.bytes, result.info.mime, `decoded.${result.info.ext}`)
                }
                className={btn}
              >
                {t("result.download")}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={displayText}
            spellCheck={false}
            className="h-64 w-full resize-y rounded-lg border border-edge bg-well p-3 text-xs leading-relaxed font-mono text-ink focus:outline-none"
          />
        </div>
      )}

      {!result.isUtf8 && !isImage && result.info.kind !== "pdf" && result.info.kind !== "jwt" && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-dim">
            {t("result.binary", {
              size: formatBytes(result.sizeBytes),
              ext: result.info.ext,
            })}
          </p>
          <button
            type="button"
            onClick={() =>
              downloadBlob(result.bytes, result.info.mime, `decoded.${result.info.ext}`)
            }
            className={btnPrimary}
          >
            {t("result.downloadFile")}
          </button>
        </div>
      )}

      {result.info.kind === "empty" && <p className="text-sm text-dim">{t("result.empty")}</p>}
    </div>
  );
}
