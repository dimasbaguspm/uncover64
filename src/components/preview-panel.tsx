import { clsx } from "clsx";
import { ExternalLink, Frame, Fullscreen, ZoomIn, ZoomOut } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CompressFormat, FileInfo } from "@/lib/types";
import { formatBytes } from "@/lib/utils/format";
import { createObjectUrl, revokeObjectUrl } from "@/lib/utils/download";
import { trackEvent } from "@/lib/analytics/track";
import { Badge } from "./ui";

export interface PreviewData {
  bytes: Uint8Array;
  info: FileInfo;
  sizeBytes: number;
  image?: { width: number; height: number } | null;
  text?: string;
  decompressed?: CompressFormat;
}

const zoomStep = 0.25;
const zoomMin = 0.5;
const zoomMax = 4;

export const PreviewPanel = memo(function PreviewPanel({
  bytes,
  info,
  sizeBytes,
  image,
  text,
  decompressed,
  compression,
  selectedSize,
  selectedChars,
  onFullscreen,
  bare,
}: PreviewData & {
  compression?: string;
  selectedSize?: number;
  selectedChars?: number;
  onFullscreen?: () => void;
  bare?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(false);

  const url = useMemo(
    () => (bytes.length ? createObjectUrl(bytes, info.mime) : null),
    [bytes, info.mime],
  );
  useEffect(() => {
    return () => {
      if (url) revokeObjectUrl(url);
    };
  }, [url]);

  const mime = info.mime;
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  const isAudio = mime.startsWith("audio/");
  const isPdf = info.kind === "pdf";
  const isJwt = info.kind === "jwt";
  const isText = text !== undefined && text !== "";
  const showToolbar = isImage;

  const openInTab = () => {
    if (bytes.length === 0) return;
    const tabUrl = createObjectUrl(bytes, info.mime);
    const a = document.createElement("a");
    a.href = tabUrl;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => revokeObjectUrl(tabUrl), 60_000);
  };

  const toggleFullscreen = () => onFullscreen?.();

  const zoomOut = () => {
    setFit(false);
    setZoom((z) => Math.max(zoomMin, +(z - zoomStep).toFixed(2)));
    trackEvent("preview_zoom", { direction: "out" });
  };
  const zoomIn = () => {
    setFit(false);
    setZoom((z) => Math.min(zoomMax, +(z + zoomStep).toFixed(2)));
    trackEvent("preview_zoom", { direction: "in" });
  };

  const iconBtn =
    "rounded p-1 text-dim transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40";

  const controls = (
    <div className="flex items-center gap-1 border-b border-edge px-2 py-1">
      <button type="button" onClick={zoomOut} aria-label={t("preview.zoomOut")} className={iconBtn}>
        <ZoomOut className="size-4" aria-hidden />
      </button>
      <button type="button" onClick={zoomIn} aria-label={t("preview.zoomIn")} className={iconBtn}>
        <ZoomIn className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => {
          setFit(false);
          setZoom(1);
        }}
        title={t("preview.reset")}
        className="w-12 rounded px-1 py-1 text-center text-xs font-medium text-ink transition-colors hover:bg-surface-2"
      >
        {fit ? "Fit" : `${Math.round(zoom * 100)}%`}
      </button>
      <button
        type="button"
        onClick={() => setFit((f) => !f)}
        aria-label={t("preview.fit")}
        title={t("preview.fit")}
        className={clsx(iconBtn, fit && "bg-surface-2 text-accent")}
      >
        <Frame className="size-4" aria-hidden />
      </button>
      <div className="ml-auto flex items-center gap-1">
        {onFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={t("preview.fullscreen")}
            title={t("preview.fullscreen")}
            className={iconBtn}
          >
            <Fullscreen className="size-4" aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={openInTab}
          disabled={!url}
          aria-label={t("preview.openTab")}
          title={t("preview.openTab")}
          className={iconBtn}
        >
          <ExternalLink className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );

  const content = (
    <div className="min-h-0 flex-1 overflow-auto bg-[var(--preview-bg)] p-3">
      {isImage && (
        <div className="flex min-h-full items-center justify-center">
          {fit ? (
            <img src={url!} alt="Preview" className="max-w-full object-contain" />
          ) : (
            <img
              src={url!}
              alt="Preview"
              className="max-w-none transition-transform"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
              }}
            />
          )}
        </div>
      )}
      {isVideo && (
        <video
          controls
          src={url!}
          className="w-full"
          style={fit ? undefined : { transform: `scale(${zoom})`, transformOrigin: "top left" }}
        />
      )}
      {isAudio && <audio controls src={url!} className="w-full" />}
      {isPdf && <iframe src={url!} title="Preview" className="h-full min-h-96 w-full border-0" />}
      {(isText || isJwt) && (
        <pre
          className="text-ink break-all whitespace-pre-wrap font-mono"
          style={{ fontSize: `${12 * zoom}px` }}
        >
          {text}
        </pre>
      )}
      {!isText && !isJwt && !isImage && !isVideo && !isAudio && !isPdf && (
        <p className="text-sm text-dim">
          {t("result.binary", { size: formatBytes(sizeBytes), ext: info.ext })}
        </p>
      )}
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {!bare && (
        <div className="flex flex-wrap items-center gap-2 border-b border-edge px-3 py-2">
          <Badge info={info} />
          {compression ? (
            <>
              <span className="text-xs text-faint">
                {selectedSize !== undefined ? formatBytes(selectedSize) : formatBytes(sizeBytes)}
                {selectedChars !== undefined &&
                  ` · ${t("common.chars", {
                    count: selectedChars.toLocaleString(i18n.language),
                  })}`}
              </span>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                {t("record.compression")} · {compression}
              </span>
            </>
          ) : (
            <>
              <span className="text-xs text-faint">
                {formatBytes(sizeBytes)}
                {image && ` · ${image.width}×${image.height}`}
              </span>
              {decompressed && (
                <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
                  {t("decode.decompressed", { algo: decompressed })}
                </span>
              )}
            </>
          )}
        </div>
      )}
      {!bare && showToolbar && controls}
      {content}
    </div>
  );
});
