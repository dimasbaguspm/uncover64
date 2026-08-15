import { DropdownMenu } from "@/components/dropdown-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { FEEDBACK_URL } from "@/constants/misc";
import { useQueryParam } from "@/hooks/use-query-param";
import { useTheme } from "@/hooks/use-theme";
import { trackEvent } from "@/lib/analytics/track";
import { Bookmark, MessageSquareText, Moon, MoreVertical, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const [, setDrawer] = useQueryParam("drawer");

  return (
    <footer className="relative z-30 shrink-0 border-t border-edge">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-1">
        <div className="flex items-center justify-start gap-0.5">
          <button
            type="button"
            onClick={() => {
              trackEvent("history_open");
              setDrawer("history");
            }}
            aria-label={t("history.title")}
            title={t("history.title")}
            className="rounded p-1.5 text-dim transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Bookmark className="size-4" aria-hidden />
          </button>
        </div>

        <a
          href="https://uncover64.dimasbaguspm.dev"
          target="_blank"
          rel="noreferrer"
          onClick={() => trackEvent("footer_link", { url: "https://uncover64.dimasbaguspm.dev" })}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-dim transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <span className="hidden sm:inline">uncover64.dimasbaguspm.dev</span>
          <span className="sm:hidden">uncover64</span>
        </a>

        <div className="flex items-center justify-end gap-1 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              trackEvent("theme_toggle", { theme: theme === "dark" ? "light" : "dark" });
              toggle();
            }}
            aria-label={t("footer.theme")}
            title={t("footer.theme")}
            className="rounded p-1.5 text-dim transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {theme === "dark" ? (
              <Sun className="size-4" aria-hidden />
            ) : (
              <Moon className="size-4" aria-hidden />
            )}
          </button>

          <LanguageSwitcher variant="select" />

          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent-strong sm:flex"
          >
            <MessageSquareText className="size-4" aria-hidden />
            {t("footer.feedback")}
          </a>
          <div className="sm:hidden">
            <DropdownMenu
              label={t("menu.more")}
              trigger={<MoreVertical className="size-4" aria-hidden />}
              side="top"
            >
              <LanguageSwitcher variant="menu" />
              <div className="my-1 h-px bg-edge" />
              <a
                href={FEEDBACK_URL}
                target="_blank"
                rel="noreferrer"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-ink transition-colors hover:bg-surface-2"
              >
                <MessageSquareText className="size-4 text-dim" aria-hidden />
                {t("footer.feedback")}
              </a>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </footer>
  );
}
