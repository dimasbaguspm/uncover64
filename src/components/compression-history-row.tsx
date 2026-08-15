import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CompressionRecord } from "@/lib/db";

export function CompressionHistoryRow({
  compression,
  onClick,
}: {
  compression: CompressionRecord;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-edge bg-surface-2/40 px-3 py-2 text-left transition-colors hover:bg-surface-2"
    >
      <FileText className="size-4 shrink-0 text-accent" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">
          {compression.variations.length} {t("encode.variations")}
        </span>
        <span className="block text-xs text-faint">
          {new Date(compression.createdAt).toLocaleString()}
        </span>
      </span>
    </button>
  );
}
