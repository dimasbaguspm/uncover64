import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CompressFormat, ExportFormat } from "@/lib/types";
import { COMPRESSION_LABELS } from "@/constants/compression";
import { DEFAULT_SECRET_KEY, DEFAULT_SECRET_NAME } from "@/constants/formats";
import { exportValue } from "@/lib/export";
import { goSnippet, nodeSnippet } from "@/lib/base64";
import { ExportFormatList } from "./export-format-list";
import { SnippetToggle } from "./snippet-toggle";
import { CodeBlock, CopyButton, inputCls } from "./ui";

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
        <ExportFormatList value={format} onChange={setFormat} />
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
            <SnippetToggle value={lang} onChange={setLang} />
          </div>
          <CodeBlock code={snippet} />
        </div>
      )}
    </div>
  );
}
