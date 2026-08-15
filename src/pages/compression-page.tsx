import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useHistory } from "@/providers/history-provider";
import { useWorker } from "@/providers/worker-provider";
import { trackEvent } from "@/lib/analytics/track";
import { formatBytes } from "@/lib/utils/format";
import { sort } from "radash";
import { SplitPane } from "@/components/split-pane";
import { PaneHeader } from "@/components/pane-header";
import { RecordDetail, recordVariations } from "@/components/record-detail";
import { PreviewPanel, type PreviewData } from "@/components/preview-panel";
import { FullscreenViewer } from "@/components/fullscreen-viewer";
import { Shimmer } from "@/components/ui";

export default function CompressionPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { assetId, compressionId } = useParams<{ assetId: string; compressionId: string }>();
  const { getAsset, getCompression, getBase64, ready } = useHistory();
  const { decode } = useWorker();
  const [selectedId, setSelectedId] = useState("raw");
  const [exportBase64, setExportBase64] = useState<string | null>(null);
  const [base64Loading, setBase64Loading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const asset = getAsset(assetId ?? "");
  const compression = getCompression(compressionId ?? "");

  useEffect(() => {
    setSelectedId("raw");
    setViewerIndex(null);
  }, [compressionId]);

  const variations = useMemo(
    () => (compression ? recordVariations(compression, t) : []),
    [compression, t],
  );

  useEffect(() => {
    if (!compression || !asset) {
      setPreview(null);
      setPreviewLoading(false);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    void (async () => {
      const sel = variations.find((v) => v.id === selectedId);
      const b64 = await getBase64(compression.uuid, selectedId);
      if (!b64 || cancelled) return;
      const res = await decode(b64, sel?.algorithm ?? null);
      if (cancelled) return;
      if (!res) {
        setPreviewLoading(false);
        return;
      }
      setPreview({
        bytes: res.bytes,
        info: res.info,
        sizeBytes: res.sizeBytes,
        image: res.image,
        text: res.text || undefined,
      });
      setPreviewLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [compression, asset, selectedId, variations, getBase64, decode]);

  useEffect(() => {
    if (!compression) {
      setExportBase64(null);
      setBase64Loading(false);
      return;
    }
    let cancelled = false;
    setBase64Loading(true);
    setExportBase64(null);
    void (async () => {
      const b64 = await getBase64(compression.uuid, selectedId);
      if (cancelled) return;
      setExportBase64(b64);
      setBase64Loading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [compression, selectedId, getBase64]);

  const onSelect = useCallback((v: { id: string }) => {
    setSelectedId(v.id);
    setViewerIndex(null);
  }, []);

  const selectedVariation = variations.find((v) => v.id === selectedId);

  const bestId = useMemo(() => {
    const best = sort(variations.filter((v) => v.algorithm), (v) => v.byteLength)[0];
    return best?.id ?? null;
  }, [variations]);

  const handleOpenFullscreen = useCallback(() => {
    const idx = variations.findIndex((v) => v.id === selectedId);
    trackEvent("fullscreen_open", { label: variations[idx]?.label ?? "" });
    setViewerIndex(idx >= 0 ? idx : 0);
  }, [variations, selectedId]);

  const handleNav = useCallback(
    (delta: number) => {
      if (viewerIndex === null) return;
      trackEvent("fullscreen_nav", { direction: delta > 0 ? "next" : "prev" });
      const next = (viewerIndex + delta + variations.length) % variations.length;
      setViewerIndex(next);
      setSelectedId(variations[next].id);
    },
    [viewerIndex, variations],
  );

  const handleCloseFullscreen = useCallback(() => {
    trackEvent("fullscreen_close");
    setViewerIndex(null);
  }, []);

  if (!ready) {
    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <Shimmer className="h-16 w-16 rounded-full" />
      </div>
    );
  }

  if (!compression || !asset) {
    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <p className="text-sm text-faint">{t("detail.notFound")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-edge px-3 py-2">
          <button
            type="button"
            onClick={() => navigate(`/encode/${asset.uuid}`)}
            aria-label={t("encode.back")}
            title={t("encode.back")}
            className="rounded p-1.5 text-dim transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{compression.name}</p>
            <p className="text-xs text-faint">
              {compression.variations.length} {t("encode.variations")} ·{" "}
              {new Date(compression.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <SplitPane
          storageKey="compression-split"
          left={
            <RecordDetail
              record={compression}
              selectedId={selectedId}
              onSelect={onSelect}
              base64={exportBase64}
              base64Loading={base64Loading}
            />
          }
          right={
            <div className="flex h-full min-h-0 flex-col">
              <PaneHeader title={t("record.preview")} />
              {preview ? (
                <div className="min-h-0 flex-1">
                  <PreviewPanel
                    {...preview}
                    compression={selectedVariation?.algorithm ? selectedVariation.label : undefined}
                    selectedSize={
                      selectedVariation?.algorithm ? selectedVariation.byteLength : undefined
                    }
                    selectedChars={
                      selectedVariation?.algorithm ? selectedVariation.base64Length : undefined
                    }
                    onFullscreen={handleOpenFullscreen}
                  />
                </div>
              ) : (
                <div className="p-3">
                  <Shimmer className="h-40 w-full" />
                </div>
              )}
              {previewLoading && (
                <div className="flex items-center gap-2 border-t border-edge px-3 py-1.5 text-xs text-faint">
                  <span className="inline-block size-3 animate-spin rounded-full border border-edge border-t-accent" />
                  {t("record.loadingPreview")}
                </div>
              )}
            </div>
          }
        />
      </div>

      {viewerIndex !== null && preview && variations[viewerIndex] && (
        <FullscreenViewer
          index={viewerIndex}
          total={variations.length}
          label={variations[viewerIndex].label}
          sizeLabel={formatBytes(variations[viewerIndex].byteLength)}
          lengthLabel={t("common.chars", {
            count: variations[viewerIndex].base64Length.toLocaleString(i18n.language),
          })}
          recommended={variations[viewerIndex].id === bestId}
          loading={previewLoading}
          onNav={handleNav}
          onClose={handleCloseFullscreen}
        >
          <PreviewPanel {...preview} bare />
        </FullscreenViewer>
      )}
    </>
  );
}
