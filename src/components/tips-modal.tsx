import { Search, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Tip {
  title: string;
  body: string;
}

export function TipsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  if (!open) return null;

  const tips = t("tips.list", { returnObjects: true }) as Tip[];
  const q = query.trim().toLowerCase();
  const filtered = q
    ? tips.filter((tip) => `${tip.title} ${tip.body}`.toLowerCase().includes(q))
    : tips;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-lg flex-col border border-edge bg-surface">
        <div className="flex items-center gap-2 border-b border-edge px-3 py-2.5">
          <Search className="size-4 text-faint" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("tips.search")}
            className="w-full bg-transparent text-sm text-ink placeholder-faint focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={t("changelog.close")}
            className="rounded p-1 text-dim transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-faint">{t("tips.empty")}</p>
          ) : (
            filtered.map((tip, i) => (
              <div key={i} className="mb-3 border border-edge p-3 last:mb-0">
                <p className="text-sm font-medium text-ink">{tip.title}</p>
                <p className="mt-0.5 text-xs text-dim">{tip.body}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
