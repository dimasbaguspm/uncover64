import { clsx } from "clsx";
import { Globe } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NestedMenuItem } from "@/components/dropdown-menu";
import { LANGUAGES, setLocale } from "@/i18n";
import { trackEvent } from "@/lib/analytics/track";

export function LanguageSwitcher({ variant }: { variant: "select" | "menu" }) {
  const { t, i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);

  if (variant === "select") {
    return (
      <label className="hidden items-center gap-1.5 sm:flex" title={t("footer.language")}>
        <Globe className="size-4 text-dim" aria-hidden />
        <select
          value={i18n.language}
          onChange={(e) => {
            trackEvent("language_select", { code: e.target.value });
            setLocale(e.target.value);
          }}
          aria-label={t("footer.language")}
          className="bg-transparent text-xs font-medium text-ink focus:outline-none"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.code.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <NestedMenuItem label={t("footer.language")} open={langOpen} onOpen={setLangOpen}>
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          role="menuitem"
          onClick={() => {
            trackEvent("language_select", { code: l.code });
            setLocale(l.code);
          }}
          className={clsx(
            "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors",
            i18n.language === l.code ? "text-accent" : "text-ink hover:bg-surface-2",
          )}
        >
          {l.label}
          {i18n.language === l.code && (
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          )}
        </button>
      ))}
    </NestedMenuItem>
  );
}
