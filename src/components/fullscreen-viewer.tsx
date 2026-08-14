import { ChevronLeft, ChevronRight, Star, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Shimmer } from "./ui";

export function FullscreenViewer({
  index,
  total,
  label,
  sizeLabel,
  lengthLabel,
  recommended,
  loading,
  onNav,
  onClose,
  children,
}: {
  index: number;
  total: number;
  label: string;
  sizeLabel?: string;
  lengthLabel?: string;
  recommended?: boolean;
  loading: boolean;
  onNav: (delta: number) => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNav(-1);
      if (e.key === "ArrowRight") onNav(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNav, onClose]);

  const arrowBtn =
    "absolute top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-accent/40 bg-surface text-accent shadow-[var(--shadow)] transition-colors hover:bg-surface-2 hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--preview-bg)]">
      <div className="flex items-center justify-between gap-3 border-b border-edge px-3 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink">
          <span className="flex items-center gap-2 font-semibold tracking-wide uppercase">
            {label}
            {recommended && (
              <span className="flex items-center gap-0.5 rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent normal-case">
                <Star className="size-2.5" fill="currentColor" aria-hidden />
                {t("record.recommended")}
              </span>
            )}
          </span>
          {(sizeLabel || lengthLabel) && (
            <span className="font-normal text-faint normal-case">
              {[sizeLabel, lengthLabel].filter(Boolean).join(" · ")}
            </span>
          )}
          <span className="font-normal text-faint normal-case">
            {index + 1} / {total}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("changelog.close")}
          className="shrink-0 rounded p-1 text-dim transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 overflow-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            {loading ? (
              <Shimmer className="h-2/3 w-full max-w-2xl" />
            ) : (
              <div className="max-w-5xl">{children}</div>
            )}
          </div>
        </div>
        {total > 1 && (
          <button
            type="button"
            onClick={() => onNav(-1)}
            aria-label={t("preview.prev")}
            className={arrowBtn}
            style={{ left: "1rem" }}
          >
            <ChevronLeft className="size-6" aria-hidden />
          </button>
        )}
        {total > 1 && (
          <button
            type="button"
            onClick={() => onNav(1)}
            aria-label={t("preview.next")}
            className={arrowBtn}
            style={{ right: "1rem" }}
          >
            <ChevronRight className="size-6" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
