import { FileText, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Asset } from "@/lib/db";
import { detect } from "@/lib/base64";
import { formatBytes } from "@/lib/utils/format";
import { Badge } from "./ui";

export function HistoryRow({
  entry,
  onOpen,
  onDelete,
}: {
  entry: Asset;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="group mb-1.5 flex items-center gap-3 rounded-lg border border-edge bg-surface-2/40 px-2.5 py-2 transition-colors last:mb-0 hover:border-edge-strong hover:bg-surface-2">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded bg-accent/10">
          <FileText className="size-4 text-accent" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{entry.name}</span>
          <span className="block text-xs text-faint">
            {formatBytes(entry.sizeBytes)} · {new Date(entry.createdAt).toLocaleString()}
          </span>
        </span>
        {entry.bytes.length > 0 && <Badge info={detect(entry.bytes)} />}
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={t("history.delete")}
        className="shrink-0 rounded p-1.5 text-faint opacity-60 transition-opacity hover:bg-[var(--tint-rose-bg)] hover:text-[var(--tint-rose-fg)] group-hover:opacity-100"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </div>
  );
}
