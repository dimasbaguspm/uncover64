import { ClipboardPaste } from "lucide-react";
import { type ClipboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useEncoder } from "@/hooks/use-encoder";
import { useDecode } from "@/hooks/use-decode";
import { DecompressSelect } from "@/components/decompress-select";
import { SplitPane } from "@/components/split-pane";
import { PreviewPanel } from "@/components/preview-panel";
import { ErrorBanner, Shimmer } from "@/components/ui";
import { tryCatch } from "@/lib/utils/try-catch";

export default function DecodePage() {
  const { t } = useTranslation();
  const { error } = useEncoder();
  const { input, setInput, decompress, setDecompress, result, pending } = useDecode();

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
    <SplitPane storageKey="decode-split">
      <SplitPane.Left>
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-edge px-3 py-1.5">
            <DecompressSelect value={decompress} onChange={setDecompress} />
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
      </SplitPane.Left>
      <SplitPane.Right>
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
      </SplitPane.Right>
    </SplitPane>
  );
}
