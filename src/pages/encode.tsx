import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { utf8Decode } from "../lib/base64";
import { useWorker } from "../providers/worker-provider";
import { useHistory } from "../providers/history-provider";
import { useFileDrop } from "../hooks/use-file-drop";
import { variationKey } from "../components/record-detail";
import { DropOverlay } from "../components/drop-overlay";
import { UploadZone } from "../components/upload-zone";
import { ErrorBanner, Shimmer } from "../components/ui";

export default function EncodePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { encodeAll, busy, error } = useWorker();
  const { add } = useHistory();

  const save = useCallback(
    async (name: string, bytes: Uint8Array) => {
      const rawText = utf8Decode(bytes) ?? "";
      const res = await encodeAll(bytes.slice().buffer);
      if (!res) return;
      const rec = await add(
        {
          name,
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
    },
    [encodeAll, add, navigate],
  );

  const handleFile = useCallback(
    async (file: File) => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      await save(file.name, bytes);
    },
    [save],
  );

  const isDragging = useFileDrop((file) => void handleFile(file));

  return (
    <>
      <DropOverlay active={isDragging} />
      <div className="flex w-full flex-1 flex-col">
        {busy ? (
          <div className="flex flex-1 flex-col gap-2 p-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Shimmer key={i} className="h-12 w-full" />
            ))}
            <p className="mt-2 text-center text-xs text-faint">{t("encode.preparing")}</p>
          </div>
        ) : (
          <div className="flex flex-1 p-4">
            <UploadZone title={t("encode.dropTitle")} onFile={(f) => void handleFile(f)} />
          </div>
        )}

        <div className="p-3">
          <ErrorBanner message={error ?? ""} />
        </div>
      </div>
    </>
  );
}
