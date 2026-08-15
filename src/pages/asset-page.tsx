import { clsx } from "clsx";
import { ArrowLeft, CheckSquare, Square } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import type { CompressFormat } from "@/lib/types";
import { detect } from "@/lib/base64";
import {
  ALL_COMPRESSION_ALGOS,
  COMPRESSION_LABELS,
  COMPRESSION_QUALITIES,
  QUALITY_ORIGINAL,
} from "@/constants/compression";
import { formatBytes } from "@/lib/utils/format";
import { useHistory } from "@/providers/history-provider";
import { useEncoder } from "@/hooks/use-encoder";
import { trackEvent } from "@/lib/analytics/track";
import { SplitPane } from "@/components/split-pane";
import { PaneHeader } from "@/components/pane-header";
import { PreviewPanel, type PreviewData } from "@/components/preview-panel";
import { CompressionHistoryRow } from "@/components/compression-history-row";
import { QualityOption } from "@/components/quality-option";
import { ErrorBanner, Shimmer, Spinner, btnPrimary } from "@/components/ui";

const LZ_KEY = "lz";
const QUALITY_ALGOS = ALL_COMPRESSION_ALGOS.filter((a) => a !== "lz");
const ALL_KEYS = [
  ...QUALITY_ALGOS.flatMap((a) => COMPRESSION_QUALITIES.map((q) => `${a}:${q}`)),
  LZ_KEY,
];

export default function AssetPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { assetId } = useParams<{ assetId: string }>();
  const { getAsset, compressionsForAsset, addCompression, ready } = useHistory();
  const { encodeSelected, busy, error } = useEncoder();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const asset = getAsset(assetId ?? "");
  const history = useMemo(
    () => compressionsForAsset(assetId ?? ""),
    [compressionsForAsset, assetId],
  );

  const preview = useMemo<PreviewData | null>(() => {
    if (!asset || asset.bytes.length === 0) return null;
    const info = detect(asset.bytes);
    return {
      bytes: asset.bytes,
      info,
      sizeBytes: asset.sizeBytes,
      text: asset.rawText || undefined,
    };
  }, [asset]);

  const toggle = (key: string) => {
    const checked = !selected.has(key);
    if (key === LZ_KEY) {
      trackEvent("encode_toggle", { algo: "lz", checked });
    } else {
      const [algo, q] = key.split(":");
      trackEvent("encode_toggle", { algo, quality: Number(q), checked });
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const setAll = (all: boolean) => {
    trackEvent(all ? "encode_select_all" : "encode_select_clear", { count: ALL_KEYS.length });
    setSelected(all ? new Set(ALL_KEYS) : new Set());
  };

  const proceed = async () => {
    if (!asset || selected.size === 0) return;
    const selections = [...selected].map((key): { algorithm: CompressFormat; quality: number } => {
      if (key === LZ_KEY) return { algorithm: "lz", quality: QUALITY_ORIGINAL };
      const [algo, q] = key.split(":");
      return { algorithm: algo as CompressFormat, quality: Number(q) };
    });
    const res = await encodeSelected(asset.bytes.slice().buffer, selections);
    if (!res) return;
    const comp = await addCompression(asset.uuid, asset.name, res);
    navigate(`/encode/${asset.uuid}/compress/${comp.uuid}`);
  };

  if (!ready) {
    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <Shimmer className="h-16 w-16 rounded-full" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <p className="text-sm text-faint">{t("detail.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-edge px-3 py-2">
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label={t("encode.back")}
          title={t("encode.back")}
          className="rounded p-1.5 text-dim transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{asset.name}</p>
          <p className="text-xs text-faint">
            {formatBytes(asset.sizeBytes)} · {t("encode.algos")}
          </p>
        </div>
      </div>

      <SplitPane
        storageKey="asset-split"
        left={
          <div className="flex h-full min-h-0 flex-col overflow-y-auto">
            <div className="flex flex-col gap-5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">{t("encode.algos")}</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAll(true)}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs text-dim transition-colors hover:text-ink"
                  >
                    <CheckSquare className="size-3.5" aria-hidden />
                    {t("encode.selectAll")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAll(false)}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs text-dim transition-colors hover:text-ink"
                  >
                    <Square className="size-3.5" aria-hidden />
                    {t("encode.clear")}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {QUALITY_ALGOS.map((algo) => (
                  <div key={algo} className="rounded-lg border border-edge bg-surface p-3">
                    <p className="mb-2 text-sm font-medium text-ink">{COMPRESSION_LABELS[algo]}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {COMPRESSION_QUALITIES.map((q) => {
                        const key = `${algo}:${q}`;
                        const on = selected.has(key);
                        return (
                          <QualityOption
                            key={key}
                            algo={algo}
                            quality={q}
                            selected={on}
                            onChange={toggle}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="rounded-lg border border-edge bg-surface p-3">
                  <p className="mb-2 text-sm font-medium text-ink">{COMPRESSION_LABELS.lz}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <label
                      className={clsx(
                        "flex cursor-pointer items-center gap-1.5 rounded border px-2 py-1 text-xs transition-colors",
                        selected.has(LZ_KEY)
                          ? "border-accent/60 bg-accent/10 text-accent"
                          : "border-edge hover:bg-surface-2",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(LZ_KEY)}
                        onChange={() => toggle(LZ_KEY)}
                        className="accent-[var(--accent)]"
                      />
                      {COMPRESSION_LABELS.lz}
                    </label>
                  </div>
                </div>
              </div>

              <ErrorBanner message={error ?? ""} />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={proceed}
                  disabled={busy || selected.size === 0}
                  className={btnPrimary}
                >
                  {busy ? <Spinner /> : `${t("encode.proceed")} · ${selected.size}`}
                </button>
                <span className="text-xs text-faint">{t("encode.local")}</span>
              </div>

              {history.length > 0 && (
                <div className="border-t border-edge pt-4">
                  <p className="mb-2 text-xs font-medium tracking-wide text-faint uppercase">
                    {t("encode.history")}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {history.map((comp) => (
                      <CompressionHistoryRow
                        key={comp.uuid}
                        compression={comp}
                        onClick={() =>
                          navigate(`/encode/${asset.uuid}/compress/${comp.uuid}`)
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        }
        right={
          <div className="flex h-full min-h-0 flex-col">
            <PaneHeader title={t("record.preview")} />
            <div className="min-h-0 flex-1">
              {preview ? (
                <PreviewPanel {...preview} />
              ) : (
                <div className="p-3">
                  <Shimmer className="h-40 w-full" />
                </div>
              )}
            </div>
          </div>
        }
      />
    </div>
  );
}
