import { Minus, Play, Plus, WrapText, X } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DecodeResult } from "../lib/types";
import { prettyJson } from "../lib/utils/format";
import { useWorker } from "../providers/worker-provider";
import { SplitPane } from "../components/split-pane";
import { ErrorBanner, Shimmer, Spinner } from "../components/ui";
import type { DiffLanguage } from "../components/monaco-diff";

const MonacoDiff = lazy(() => import("../components/monaco-diff"));

function toDisplay(res: DecodeResult): string {
  if (res.info.kind === "json" && res.text) return prettyJson(res.text);
  if (res.info.kind === "jwt" && res.jwt) {
    return `${res.jwt.header}\n\n${res.jwt.payload}`;
  }
  return res.text ?? "";
}

function toLanguage(res: DecodeResult | null): DiffLanguage {
  if (res && (res.info.kind === "json" || res.info.kind === "jwt")) return "json";
  return "plaintext";
}

function DiffModal({
  original,
  modified,
  language,
  onClose,
}: {
  original: string;
  modified: string;
  language: DiffLanguage;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [wrap, setWrap] = useState(true);
  const [fontSize, setFontSize] = useState(13);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-edge px-3 py-2">
        <div className="flex items-center gap-3 text-xs text-faint">
          <span className="text-ink">A</span>
          <span>vs</span>
          <span className="text-ink">B</span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase">
            {language}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center rounded border border-edge bg-surface-2">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(9, s - 1))}
              aria-label={t("diff.fontDecrease")}
              title={t("diff.fontDecrease")}
              className="rounded p-1 text-ink transition-colors hover:bg-surface"
            >
              <Minus className="size-3.5" aria-hidden />
            </button>
            <span className="w-8 text-center text-xs text-faint">{fontSize}</span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(28, s + 1))}
              aria-label={t("diff.fontIncrease")}
              title={t("diff.fontIncrease")}
              className="rounded p-1 text-ink transition-colors hover:bg-surface"
            >
              <Plus className="size-3.5" aria-hidden />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setWrap((w) => !w)}
            aria-label={wrap ? t("diff.unwrap") : t("diff.wrap")}
            title={wrap ? t("diff.unwrap") : t("diff.wrap")}
            className="flex items-center gap-1.5 rounded border border-edge bg-surface-2 px-2 py-1 text-xs text-ink transition-colors hover:border-edge-strong"
          >
            <WrapText className="size-3.5" aria-hidden />
            {wrap ? t("diff.unwrap") : t("diff.wrap")}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("changelog.close")}
            className="rounded p-1 text-dim transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 p-2">
        <Suspense fallback={<Shimmer className="h-full w-full" />}>
          <MonacoDiff
            original={original}
            modified={modified}
            language={language}
            wrap={wrap}
            fontSize={fontSize}
          />
        </Suspense>
      </div>
    </div>
  );
}

export default function DiffPage() {
  const { t } = useTranslation();
  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");
  const [compare, setCompare] = useState<{
    original: string;
    modified: string;
    language: DiffLanguage;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const { decode, error } = useWorker();
  const decodeRef = useRef(decode);
  decodeRef.current = decode;

  const runDiff = async () => {
    setPending(true);
    const [a, b] = await Promise.all([
      decodeRef.current(inputA, "auto"),
      decodeRef.current(inputB, "auto"),
    ]);
    const textA = a ? toDisplay(a) : inputA.trim();
    const textB = b ? toDisplay(b) : inputB.trim();
    setCompare({ original: textA, modified: textB, language: toLanguage(a) });
    setPending(false);
  };

  const editorCls =
    "h-full w-full min-h-0 resize-none border-0 bg-well p-3 text-sm text-ink placeholder-faint font-mono focus:outline-none";

  return (
    <div className="relative flex min-h-0 w-full flex-1">
      <SplitPane
        left={
          <textarea
            value={inputA}
            onChange={(e) => setInputA(e.target.value)}
            placeholder={t("diff.placeholderA")}
            spellCheck={false}
            className={editorCls}
          />
        }
        right={
          <textarea
            value={inputB}
            onChange={(e) => setInputB(e.target.value)}
            placeholder={t("diff.placeholderB")}
            spellCheck={false}
            className={editorCls}
          />
        }
        initialRatio={0.5}
      />

      <button
        type="button"
        onClick={runDiff}
        disabled={pending || !inputA.trim() || !inputB.trim()}
        aria-label={t("diff.action")}
        title={t("diff.action")}
        className="absolute top-1/2 left-1/2 z-20 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-accent/40 bg-surface text-accent shadow-[var(--shadow)] transition-colors hover:bg-surface-2 hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? <Spinner /> : <Play className="ml-0.5 size-5" aria-hidden />}
      </button>

      <div className="absolute bottom-3 left-1/2 z-20 w-max max-w-[90%] -translate-x-1/2">
        <ErrorBanner message={error ?? ""} />
      </div>

      {compare && (
        <DiffModal
          original={compare.original}
          modified={compare.modified}
          language={compare.language}
          onClose={() => setCompare(null)}
        />
      )}
    </div>
  );
}
