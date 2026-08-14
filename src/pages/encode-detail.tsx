import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { detect, utf8Decode } from "../lib/base64";
import { useHistory } from "../providers/history-provider";
import { formatBytes } from "../lib/utils/format";
import { SplitPane } from "../components/split-pane";
import { RecordDetail, recordVariations } from "../components/record-detail";
import { PreviewPanel, type PreviewData } from "../components/preview-panel";
import { FullscreenViewer } from "../components/fullscreen-viewer";
import { Shimmer } from "../components/ui";

export default function EncodeDetailPage() {
  const { t, i18n } = useTranslation();
  const { uuid } = useParams<{ uuid: string }>();
  const { records, ready, getBase64 } = useHistory();
  const [selectedId, setSelectedId] = useState("raw");
  const [exportBase64, setExportBase64] = useState<string | null>(null);
  const [base64Loading, setBase64Loading] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const record = records.find((r) => r.uuid === uuid);

  useEffect(() => {
    setSelectedId("raw");
    setViewerIndex(null);
  }, [uuid]);

  const variations = useMemo(() => (record ? recordVariations(record, t) : []), [record, t]);

  const preview = useMemo<PreviewData | null>(() => {
    if (!record) return null;
    const bytes = record.bytes ?? new Uint8Array(0);
    const info = detect(bytes);
    const text = record.rawText || utf8Decode(bytes) || undefined;
    return { bytes, info, sizeBytes: record.rawSizeBytes, text };
  }, [record]);

  useEffect(() => {
    if (!record) {
      setExportBase64(null);
      setBase64Loading(false);
      return;
    }
    let cancelled = false;
    setBase64Loading(true);
    setExportBase64(null);
    void (async () => {
      const b64 = await getBase64(record.uuid, selectedId);
      if (cancelled) return;
      setExportBase64(b64);
      setBase64Loading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [record, selectedId, getBase64]);

  const onSelect = useCallback((v: { id: string }) => {
    setSelectedId(v.id);
    setViewerIndex(null);
  }, []);

  const selectedVariation = variations.find((v) => v.id === selectedId);

  const bestId = useMemo(() => {
    let best: (typeof variations)[number] | null = null;
    for (const v of variations) {
      if (v.algorithm && (!best || v.byteLength < best.byteLength)) best = v;
    }
    return best?.id ?? null;
  }, [variations]);

  const handleOpenFullscreen = useCallback(() => {
    const idx = variations.findIndex((v) => v.id === selectedId);
    setViewerIndex(idx >= 0 ? idx : 0);
  }, [variations, selectedId]);

  const handleNav = useCallback(
    (delta: number) => {
      if (viewerIndex === null) return;
      const next = (viewerIndex + delta + variations.length) % variations.length;
      setViewerIndex(next);
      setSelectedId(variations[next].id);
    },
    [viewerIndex, variations],
  );

  if (!ready) {
    return (
      <div className="flex w-full flex-1 items-center justify-center bg-[var(--preview-bg)]">
        <Shimmer className="h-16 w-16 rounded-full" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <p className="text-sm text-faint">{t("detail.notFound")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <SplitPane
          left={
            <RecordDetail
              record={record}
              selectedId={selectedId}
              onSelect={onSelect}
              base64={exportBase64}
              base64Loading={base64Loading}
            />
          }
          right={
            preview ? (
              <PreviewPanel
                {...preview}
                compression={selectedVariation?.label}
                onFullscreen={handleOpenFullscreen}
              />
            ) : (
              <div className="p-3">
                <Shimmer className="h-40 w-full" />
              </div>
            )
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
          loading={base64Loading}
          onNav={handleNav}
          onClose={() => setViewerIndex(null)}
        >
          <PreviewPanel {...preview} bare />
        </FullscreenViewer>
      )}
    </>
  );
}
