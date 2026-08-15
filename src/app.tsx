import {
  Bookmark,
  History,
  MessageSquareText,
  Moon,
  MoreVertical,
  Star,
  Sun,
} from "lucide-react";
import { useEffect, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Drawer } from "@/components/drawer";
import { DropdownMenu, MenuItem } from "@/components/dropdown-menu";
import { ErrorBoundary } from "@/components/error-boundary";
import { HistoryDrawer } from "@/components/history-drawer";
import { GithubIcon } from "@/components/icons/github-icon";
import { Changelog } from "@/components/changelog";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NavLinks } from "@/components/nav-links";
import { FEEDBACK_URL, GITHUB_URL } from "@/constants/misc";
import { ROUTES } from "@/constants/routes";
import { useAppBoot } from "@/hooks/use-app-boot";
import { useGithubStars } from "@/hooks/use-github-stars";
import { useNavigationTrace } from "@/hooks/use-navigation-trace";
import { useQueryParam } from "@/hooks/use-query-param";
import { useTheme } from "@/hooks/use-theme";
import { trackEvent } from "@/lib/analytics/track";
import AssetPage from "@/pages/asset-page";
import CompressionPage from "@/pages/compression-page";
import DecodePage from "@/pages/decode";
import EncodePage from "@/pages/encode";
import { HistoryProvider } from "@/providers/history-provider";

const TAB_COMPONENTS: Record<string, ComponentType> = {
  "/": EncodePage,
  "/decode": DecodePage,
};

function RouteTracker() {
  useNavigationTrace();
  return null;
}

function Shell() {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const [drawer, setDrawer] = useQueryParam("drawer");
  const version = import.meta.env.VITE_APP_VERSION;
  const stars = useGithubStars();

  // Clipboard paste events → analytics provider.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      trackEvent("paste", {
        length: (e.clipboardData?.getData("text") ?? "").length,
      });
    };
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("paste", onPaste);
    };
  }, []);

  return (
    <>
      <div className="flex h-screen flex-col supports-[height:100dvh]:h-dvh">
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

        <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
          <Routes>
            {ROUTES.map((r) => (
              <Route key={r.path} path={r.path} element={<TabElement path={r.path} />} />
            ))}
            <Route
              path="/encode/:assetId"
              element={
                <ErrorBoundary>
                  <AssetPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/encode/:assetId/compress/:compressionId"
              element={
                <ErrorBoundary>
                  <CompressionPage />
                </ErrorBoundary>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

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
              href="https://uncover64.dimasbaguspm.com"
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                trackEvent("footer_link", { url: "https://uncover64.dimasbaguspm.com" })
              }
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-dim transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <span className="hidden sm:inline">uncover64.dimasbaguspm.com</span>
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
      </div>

      <HistoryDrawer open={drawer === "history"} onClose={() => setDrawer(null)} />
      <Drawer
        open={drawer === "changelog"}
        title={t("changelog.title")}
        onClose={() => setDrawer(null)}
      >
        <Changelog />
      </Drawer>
    </>
  );
}

export default function App() {
  const ready = useAppBoot();
  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <img src="/uncover64.svg" alt="" className="size-14" />
          <span className="inline-block size-5 animate-spin rounded-full border-2 border-edge border-t-accent" />
        </div>
      </div>
    );
  }

  return (
    <HistoryProvider>
      <BrowserRouter>
        <RouteTracker />
        <Shell />
      </BrowserRouter>
    </HistoryProvider>
  );
}

function TabElement({ path }: { path: string }) {
  const Comp = TAB_COMPONENTS[path];
  return (
    <ErrorBoundary>
      <Comp />
    </ErrorBoundary>
  );
}
