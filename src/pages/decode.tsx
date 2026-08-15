import { ClipboardPaste } from "lucide-react";
import { useEffect, useRef, useState, type ClipboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { DecodeResult, DecompressOption } from "../lib/types";
import { DECOMPRESS_OPTIONS } from "../constants/compression";
import { useWorker } from "../providers/worker-provider";
import { SplitPane } from "../components/split-pane";
import { PreviewPanel } from "../components/preview-panel";
import { ErrorBanner, Shimmer } from "../components/ui";
import { tryCatch } from "../lib/utils/try-catch";

function optionLabel(id: DecompressOption, t: (key: string) => string): string {
  if (id === null) return t("decode.off");
  if (id === "auto") return t("decode.auto");
  return id[0].toUpperCase() + id.slice(1);
}

export default function DecodePage() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [decompress, setDecompress] = useState<DecompressOption>("auto");
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [pending, setPending] = useState(false);
  const { decode, error } = useWorker();

  const decodeRef = useRef(decode);
  decodeRef.current = decode;

  useEffect(() => {
    const value = input.trim();
    if (!value) {
      setResult(null);
      setPending(false);
      return;
    }
    setPending(true);
    let cancelled = false;
    const id = setTimeout(async () => {
      const res = await decodeRef.current(value, decompress);
      if (cancelled) return;
      setPending(false);
      if (res) setResult(res);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [input, decompress]);

  const paste = async () => {
    await tryCatch(
      async () => {
        const text = await navigator.clipboard.readText();
        if (text) setInput(text);
      },
      { log: false },
    );
  };

  const onPaste = async (e: ClipboardEvent) => {
    const file = e.clipboardData?.files?.[0];
    if (!file) return;
    e.preventDefault();
    const text = await file.text();
    setInput(text);
  };

  return (
    <SplitPane
      storageKey="decode-split"
      left={
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-edge px-3 py-1.5">
            <select
              value={String(decompress)}
              onChange={(e) => setDecompress(e.target.value as DecompressOption)}
              className="rounded border border-edge bg-surface-2 px-2 py-1 text-xs text-ink focus:border-accent/60 focus:outline-none"
              aria-label={t("decode.decompress")}
            >
              {DECOMPRESS_OPTIONS.map((o) => (
                <option key={String(o.id)} value={String(o.id)}>
                  {optionLabel(o.id, t)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={paste}
              className="flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent-strong"
            >
              <ClipboardPaste className="size-3.5" aria-hidden />
              {t("decode.paste")}
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={onPaste}
            placeholder={t("decode.placeholder")}
            spellCheck={false}
            className="min-h-0 w-full flex-1 resize-none border-0 bg-well p-3 text-sm text-ink placeholder-faint font-mono focus:outline-none"
          />
        </div>
      }
      right={
        <div className="flex h-full flex-col overflow-hidden">
          <div className="px-3 pt-2">
            <ErrorBanner message={error ?? ""} />
          </div>
          {pending ? (
            <div className="flex flex-col gap-2 p-3">
              <Shimmer className="h-5 w-2/3" />
              <Shimmer className="h-5 w-full" />
              <Shimmer className="h-5 w-full" />
              <Shimmer className="h-40 w-full" />
            </div>
          ) : result ? (
            <div className="min-h-0 flex-1">
              <PreviewPanel
                bytes={result.bytes}
                info={result.info}
                sizeBytes={result.sizeBytes}
                image={result.image}
                text={result.text}
                decompressed={result.decompressed}
              />
            </div>
          ) : (
            <div className="p-3 text-sm text-faint">{t("decode.liveHint")}</div>
          )}
        </div>
      }
    />
  );
}
