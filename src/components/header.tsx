import { History, MoreVertical, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DropdownMenu, MenuItem } from "@/components/dropdown-menu";
import { GithubIcon } from "@/components/icons/github-icon";
import { NavLinks } from "@/components/nav-links";
import { GITHUB_URL } from "@/constants/misc";
import { useGithubStars } from "@/hooks/use-github-stars";
import { useQueryParam } from "@/hooks/use-query-param";
import { trackEvent } from "@/lib/analytics/track";

export function Header() {
  const { t } = useTranslation();
  const [, setDrawer] = useQueryParam("drawer");
  const version = import.meta.env.VITE_APP_VERSION;
  const stars = useGithubStars();

  return (
    <header className="relative z-30 shrink-0 border-b border-edge bg-canvas/90 backdrop-blur">
      <div className="flex items-center gap-1 px-2 py-1">
        <NavLinks />

        <div className="ml-auto flex items-center gap-0.5">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label={t("menu.github")}
            title={t("menu.github")}
            onClick={() => trackEvent("nav_github")}
            className="flex items-center gap-1.5 rounded-full border border-edge bg-surface-2/50 px-2 py-1 text-dim transition-colors hover:border-edge-strong hover:bg-surface-2 hover:text-ink"
          >
            <GithubIcon size={14} />
            {stars !== null && (
              <span className="flex items-center gap-1 text-xs font-medium tabular-nums">
                <Star
                  className="size-3 text-[var(--tint-amber-fg)]"
                  fill="currentColor"
                  aria-hidden
                />
                {stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars}
              </span>
            )}
          </a>
          <button
            type="button"
            onClick={() => setDrawer("changelog")}
            aria-label={t("menu.changelog")}
            title={t("menu.changelog")}
            className="hidden rounded p-1.5 text-dim transition-colors hover:bg-surface-2 hover:text-ink sm:flex"
          >
            <History className="size-4" aria-hidden />
          </button>
          {version ? (
            <span className="ml-1 hidden items-center rounded border border-edge px-1.5 py-0.5 font-mono text-[10px] text-faint sm:inline-flex">
              {version}
            </span>
          ) : (
            <span className="ml-1 hidden items-center rounded border border-dashed border-accent/40 px-1.5 py-0.5 font-mono text-[10px] text-accent sm:inline-flex">
              {t("footer.devMode")}
            </span>
          )}
          <div className="sm:hidden">
            <DropdownMenu
              label={t("menu.more")}
              trigger={<MoreVertical className="size-4" aria-hidden />}
            >
              <MenuItem onClick={() => setDrawer("changelog")}>
                <History className="size-4 text-dim" aria-hidden />
                {t("menu.changelog")}
              </MenuItem>
              <div className="px-2 py-1.5 font-mono text-[10px] text-faint">
                {version ?? t("footer.devMode")}
              </div>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
