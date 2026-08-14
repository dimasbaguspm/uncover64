import { clsx } from "clsx";
import { Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useClipboard } from "../hooks/use-clipboard";
import type { FileInfo } from "../lib/types";
import { KIND_COLORS } from "../constants/theme";

export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const { copied, copy } = useClipboard();
  return (
    <button type="button" className={clsx(btn, className)} onClick={() => void copy(value)}>
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {copied ? t("common.copied") : (label ?? t("common.copy"))}
    </button>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-[var(--tint-rose-bd)] bg-[var(--tint-rose-bg)] px-4 py-3 text-sm font-mono text-[var(--tint-rose-fg)]"
    >
      {message}
    </div>
  );
}

export function Badge({ info }: { info: FileInfo }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        KIND_COLORS[info.kind] ?? KIND_COLORS.binary,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {info.label}
      {info.kind !== "text" && info.kind !== "json" && info.kind !== "jwt" && (
        <span className="opacity-70">· {info.ext}</span>
      )}
    </span>
  );
}

export function CodeBlock({
  code,
  label,
  maxHeight = "max-h-96",
}: {
  code: string;
  label?: string;
  maxHeight?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-edge bg-well">
      {label && (
        <div className="flex items-center justify-between border-b border-edge bg-surface-2 px-3 py-1.5">
          <span className="text-xs font-medium text-dim">{label}</span>
          <CopyButton
            value={code}
            className="!border-0 !bg-transparent !px-1 !py-0 text-xs text-dim hover:!bg-transparent hover:text-ink"
          />
        </div>
      )}
      <pre
        className={clsx("overflow-auto p-3 text-xs leading-relaxed font-mono text-ink", maxHeight)}
      >
        {code}
      </pre>
    </div>
  );
}

export const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-edge-strong hover:bg-[var(--edge)] focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-50";

export const btnActive =
  "border-accent/60 bg-accent/10 text-accent hover:border-accent/60 hover:bg-accent/15";

export const inputCls =
  "w-full rounded-lg border border-edge bg-well px-3 py-2 text-sm text-ink placeholder-faint focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20";

export function Spinner() {
  return (
    <span className="inline-block size-4 animate-spin rounded-full border-2 border-edge border-t-accent" />
  );
}

export function Shimmer({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded bg-surface-2", className)} />;
}
