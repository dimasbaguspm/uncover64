import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DecodeResult } from "@/lib/types";
import { useObjectUrl } from "@/hooks/use-object-url";
import { formatBytes, prettyJson } from "@/lib/utils/format";
import { downloadBlob } from "@/lib/utils/download";
import { Badge, CodeBlock, btnPrimary } from "./ui";
import { ImageOptimizer } from "./image-optimizer";
import { ResultActions } from "./result-actions";

export function ResultView({
  result,
  showDownscale,
}: {
  result: DecodeResult;
  showDownscale?: boolean;
}) {
  const { t } = useTranslation();
  const [pretty, setPretty] = useState(true);

  const url = useObjectUrl(result.bytes.length ? result.bytes : null, result.info.mime);

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
          <ResultActions
            isJson={isJson}
            pretty={pretty}
            onTogglePretty={() => setPretty((p) => !p)}
            text={displayText}
            mime={result.info.mime}
            ext={result.info.ext}
            bytes={result.bytes}
          />
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
