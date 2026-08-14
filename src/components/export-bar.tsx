import { clsx } from "clsx";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CompressFormat, ExportFormat } from "../lib/types";
import { COMPRESSION_LABELS } from "../constants/compression";
import { DEFAULT_SECRET_KEY, DEFAULT_SECRET_NAME, EXPORT_FORMATS } from "../constants/formats";
import { exportValue } from "../lib/export";
import { goSnippet, nodeSnippet } from "../lib/base64";
import { CodeBlock, CopyButton, btn, btnActive, inputCls } from "./ui";

const EXPORT_LABELS: Record<ExportFormat, string> = {
  raw: "export.raw",
  datauri: "export.datauri",
  env: "export.env",
  k8s: "export.k8s",
};

export function ExportBar({
  base64,
  mime,
  compressed,
}: {
  base64: string;
  mime: string;
  compressed: CompressFormat | null;
}) {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ExportFormat>("raw");
  const [secretName, setSecretName] = useState(DEFAULT_SECRET_NAME);
  const [secretKey, setSecretKey] = useState(DEFAULT_SECRET_KEY);
  const [lang, setLang] = useState<"node" | "go">("node");

  const value = exportValue(format, base64, mime, secretName, secretKey);
  const snippet = compressed
    ? lang === "node"
      ? nodeSnippet(base64, compressed)
      : goSnippet(base64, compressed)
    : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-faint uppercase">
          {t("encode.export")}
        </p>
        <div className="flex flex-wrap gap-2">
          {EXPORT_FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id)}
              className={clsx(btn, format === f.id && btnActive)}
            >
              {t(EXPORT_LABELS[f.id])}
            </button>
          ))}
        </div>
        {format === "k8s" && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-faint">{t("encode.secretName")}</span>
              <input
                className={inputCls}
                value={secretName}
                onChange={(e) => setSecretName(e.target.value)}
                spellCheck={false}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-faint">{t("encode.secretKey")}</span>
              <input
                className={inputCls}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                spellCheck={false}
              />
            </label>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium tracking-wide text-faint uppercase">
            {t("common.output")}
          </p>
          <CopyButton value={value} />
        </div>
        <textarea
          readOnly
          value={value}
          spellCheck={false}
          className="h-32 w-full resize-y rounded-lg border border-edge bg-well p-3 text-xs leading-relaxed font-mono text-accent focus:border-accent/60 focus:outline-none"
        />
      </div>

      {snippet && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium tracking-wide text-faint uppercase">
              {t("encode.snippet", { algo: COMPRESSION_LABELS[compressed!] })}
            </p>
            <div className="flex gap-1">
              {(["node", "go"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={clsx(btn, "!px-2 !py-1 text-xs", lang === l && btnActive)}
                >
                  {l === "node" ? "Node.js" : "Go"}
                </button>
              ))}
            </div>
          </div>
          <CodeBlock code={snippet} />
        </div>
      )}
    </div>
  );
}
