import { FileText, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useHistory } from "@/providers/history-provider";
import { trackEvent } from "@/lib/analytics/track";
import { HistoryRow } from "./history-row";

export function HistoryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { assets, removeAsset, clear } = useHistory();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) return;
    const id = setTimeout(() => trackEvent("history_search", { query: q }), 500);
    return () => clearTimeout(id);
  }, [query, open]);

  const handleClose = () => {
    trackEvent("history_close");
    onClose();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter(
      (a) => a.name.toLowerCase().includes(q) || a.mime.toLowerCase().includes(q),
    );
  }, [assets, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="absolute top-0 right-0 flex h-full w-full max-w-sm flex-col border-l border-edge bg-surface shadow-[var(--shadow)]">
        <div className="flex shrink-0 items-center justify-between border-b border-edge bg-surface-2 px-4 py-3">
          <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">
            {t("history.title")}
          </h2>
          <div className="flex items-center gap-1">
            {assets.length > 0 && (
              <button
                type="button"
                onClick={() => void clear()}
                aria-label={t("history.clearAll")}
                className="rounded px-2 py-1 text-xs text-[var(--tint-rose-fg)] transition-colors hover:bg-[var(--tint-rose-bg)]"
              >
                {t("history.clearAll")}
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              aria-label={t("changelog.close")}
              className="rounded p-1 text-dim transition-colors hover:bg-surface hover:text-ink"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-b border-edge px-3 py-2">
          <Search className="size-4 shrink-0 text-faint" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("history.search")}
            className="w-full bg-transparent text-sm text-ink placeholder-faint focus:outline-none"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <FileText className="size-8 text-faint" aria-hidden />
              <p className="text-sm text-faint">{t("history.empty")}</p>
            </div>
          ) : (
            filtered.map((a) => (
              <HistoryRow
                key={a.uuid}
                entry={a}
                onOpen={() => {
                  trackEvent("history_open_asset", { name: a.name });
                  navigate(`/encode/${a.uuid}`);
                }}
                onDelete={() => {
                  trackEvent("history_delete", { name: a.name });
                  if (a.id !== undefined) void removeAsset(a.id);
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
