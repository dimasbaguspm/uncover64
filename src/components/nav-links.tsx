import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { trackEvent } from "@/lib/analytics/track";

export function NavLinks() {
  const { t } = useTranslation();
  const location = useLocation();
  return (
    <nav className="flex items-center gap-0.5">
      {ROUTES.map((r) => {
        const label = t(`nav.${r.key}`);
        const active =
          r.path === "/"
            ? location.pathname === "/" || location.pathname.startsWith("/encode/")
            : location.pathname === r.path;
        return (
          <NavLink
            key={r.path}
            to={r.path}
            end={r.path === "/"}
            onClick={() => trackEvent("nav_click", { tab: r.key })}
            className={clsx(
              "rounded px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors",
              active ? "bg-surface-2 text-accent" : "text-dim hover:bg-surface-2/60 hover:text-ink",
            )}
          >
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
}
