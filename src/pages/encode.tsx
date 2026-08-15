import { clsx } from "clsx";
import { FileText, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { CompressFormat, FileInfo } from "../lib/types";
import { detect, utf8Decode } from "../lib/base64";
import {
  ALL_COMPRESSION_ALGOS,
  COMPRESSION_LABELS,
  COMPRESSION_QUALITIES,
} from "../constants/compression";
import { formatBytes } from "../lib/utils/format";
import { useWorker } from "../providers/worker-provider";
import { useHistory } from "../providers/history-provider";
import { useFileDrop } from "../hooks/use-file-drop";
import { variationKey } from "../components/record-detail";
import { DropOverlay } from "../components/drop-overlay";
import { UploadZone } from "../components/upload-zone";
import { Badge, ErrorBanner, Spinner, btn, btnActive, btnPrimary } from "../components/ui";

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export default function EncodePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [info, setInfo] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [algos, setAlgos] = useState<Set<CompressFormat>>(() => new Set(ALL_COMPRESSION_ALGOS));
  const [qualities, setQualities] = useState<Set<number>>(
    () => new Set([...COMPRESSION_QUALITIES]),
  );
  const { encodeSelected, busy, error } = useWorker();
  const { add } = useHistory();

  const onFile = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const b = new Uint8Array(buf);
      setBytes(b);
      setInfo(detect(b));
      setFile(file);
    } catch {
      setFile(null);
      setBytes(null);
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const isDragging = useFileDrop((f) => void onFile(f));

  const previewUrl = useMemo(() => {
    if (!bytes || !info?.mime.startsWith("image/")) return null;
    return URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: info.mime }));
  }, [bytes, info]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const reset = () => {
    setFile(null);
    setBytes(null);
    setInfo(null);
  };

  const selectedCount = algos.size * qualities.size;

  const runEncode = async () => {
    if (!bytes) return;
    const selections = [...algos].flatMap((a) =>
      [...qualities].map((q) => ({ algorithm: a, quality: q })),
    );
    const rawText = utf8Decode(bytes) ?? "";
    const res = await encodeSelected(bytes.slice().buffer, selections);
    if (!res) return;
    const rec = await add(
      {
        name: file?.name ?? t("common.file"),
        mime: res.mime,
        kind: res.kind,
        rawSizeBytes: res.rawSizeBytes,
        rawBase64Length: res.rawBase64Length,
        rawText,
        variations: res.variations.map((v) => ({
          algorithm: v.algorithm,
          quality: v.quality,
          byteLength: v.byteLength,
          base64Length: v.base64Length,
          ms: v.ms,
        })),
        bytes,
      },
      [
        { algorithm: "raw", base64: res.base64 },
        ...res.variations.map((v) => ({
          algorithm: variationKey(v.algorithm, v.quality),
          base64: v.base64,
        })),
      ],
    );
    navigate(`/encode/${rec.uuid}`);
  };

  return (
    <>
      <DropOverlay active={isDragging} />
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
        {loading || busy ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : !bytes ? (
          <div className="flex flex-1 p-4">
            <UploadZone title={t("encode.dropTitle")} onFile={(f) => void onFile(f)} />
          </div>
        ) : (
          <div className="flex flex-col gap-5 p-4">
            <div className="flex items-center gap-4 rounded-lg border border-edge bg-surface p-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={file?.name ?? ""}
                  className="h-24 w-24 rounded-lg border border-edge object-cover"
                />
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-lg border border-edge bg-well">
                  <FileText className="size-10 text-accent" aria-hidden />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{file?.name}</p>
                <p className="text-xs text-faint">{formatBytes(bytes.byteLength)}</p>
                {info && (
                  <div className="mt-1">
                    <Badge info={info} />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={reset}
                aria-label={t("encode.remove")}
                title={t("encode.remove")}
                className="rounded p-1.5 text-dim transition-colors hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-faint uppercase">
                {t("encode.algos")}
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_COMPRESSION_ALGOS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAlgos((s) => toggleInSet(s, a))}
                    className={clsx(btn, algos.has(a) && btnActive)}
                  >
                    {COMPRESSION_LABELS[a]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-faint uppercase">
                {t("encode.qualities")}
              </p>
              <div className="flex flex-wrap gap-2">
                {COMPRESSION_QUALITIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQualities((s) => toggleInSet(s, q))}
                    className={clsx(btn, qualities.has(q) && btnActive)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <ErrorBanner message={error ?? ""} />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={runEncode}
                disabled={selectedCount === 0}
                className={btnPrimary}
              >
                {t("encode.action")} · {selectedCount}
              </button>
              <span className="text-xs text-faint">{t("encode.local")}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
