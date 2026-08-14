import { clsx } from "clsx";
import { Bookmark, Globe, History, Lightbulb, MessageSquareText, Moon, Sun } from "lucide-react";
import { useEffect, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import EncodePage from "./pages/encode";
import EncodeDetailPage from "./pages/encode-detail";
import DecodePage from "./pages/decode";
import DiffPage from "./pages/diff";
import { WorkerProvider, useWorker } from "./providers/worker-provider";
import { HistoryProvider } from "./providers/history-provider";
import { ROUTES } from "./constants/routes";
import { ANALYTICS } from "./constants/analytics";
import { CHANGELOG } from "./constants/changelog";
import { FEEDBACK_URL, GITHUB_URL } from "./constants/misc";
import "./i18n";
import { LANGUAGES, setLocale } from "./i18n";
import { useTheme } from "./hooks/use-theme";
import { useQueryParam } from "./hooks/use-query-param";
import { Drawer } from "./components/drawer";
import { TipsModal } from "./components/tips-modal";
import { HistoryDrawer } from "./components/history-drawer";
import { GithubIcon } from "./components/icons/github-icon";

const TAB_COMPONENTS: Record<string, ComponentType> = {
  "/": EncodePage,
  "/decode": DecodePage,
  "/diff": DiffPage,
};

function NavLinks() {
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

function RouteErrorReset() {
  const location = useLocation();
  const { clearError } = useWorker();
  useEffect(() => {
    clearError();
  }, [location.pathname, clearError]);
  return null;
}

function Shell() {
  const { t, i18n } = useTranslation();
  const { theme, toggle } = useTheme();
  const [drawer, setDrawer] = useQueryParam("drawer");
  const [modal, setModal] = useQueryParam("modal");
  const version = import.meta.env.VITE_APP_VERSION;

  return (
    <>
      <div className="flex h-screen flex-col supports-[height:100dvh]:h-dvh">
        <header className="z-30 shrink-0 border-b border-edge bg-canvas/90 backdrop-blur">
          <div className="flex items-center gap-1 px-2 py-1">
            <NavLinks />

            <div className="ml-auto flex items-center gap-0.5">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                aria-label={t("menu.github")}
                title={t("menu.github")}
                className="rounded p-1.5 text-dim transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <GithubIcon size={16} />
              </a>
              <button
                type="button"
                onClick={() => setDrawer("changelog")}
                aria-label={t("menu.changelog")}
                title={t("menu.changelog")}
                className="rounded p-1.5 text-dim transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <History className="size-4" aria-hidden />
              </button>
              {version ? (
                <span className="ml-1 rounded border border-edge px-1.5 py-0.5 font-mono text-[10px] text-faint">
                  v{version}
                </span>
              ) : (
                <span
                  className="ml-1 rounded border border-dashed border-accent/40 px-1.5 py-0.5 font-mono text-[10px] text-accent"
                  title="VITE_APP_VERSION"
                >
                  {t("footer.devMode")}
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
          <Routes>
            {ROUTES.map((r) => (
              <Route key={r.path} path={r.path} element={<TabElement path={r.path} />} />
            ))}
            <Route path="/encode/:uuid" element={<EncodeDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="shrink-0 border-t border-edge">
          <div className="flex items-center justify-between gap-3 px-3 py-1">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setDrawer("history")}
                aria-label={t("history.title")}
                title={t("history.title")}
                className="rounded p-1.5 text-dim transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <Bookmark className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setModal("tips")}
                aria-label={t("menu.tips")}
                title={t("menu.tips")}
                className="rounded p-1.5 text-dim transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <Lightbulb className="size-4" aria-hidden />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggle}
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

              <label className="flex items-center gap-1.5" title={t("footer.language")}>
                <Globe className="size-4 text-dim" aria-hidden />
                <select
                  value={i18n.language}
                  onChange={(e) => setLocale(e.target.value)}
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

              <a
                href={FEEDBACK_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent-strong"
              >
                <MessageSquareText className="size-4" aria-hidden />
                {t("footer.feedback")}
              </a>
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
        {CHANGELOG.map((entry) => (
          <div
            key={entry.version}
            className="mb-2 rounded-lg border border-edge bg-surface-2/40 p-3 last:mb-0"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-accent">v{entry.version}</span>
              <span className="text-xs text-faint">{entry.date}</span>
            </div>
            <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-dim">
              {entry.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </Drawer>
      <TipsModal open={modal === "tips"} onClose={() => setModal(null)} />
    </>
  );
}

export default function App() {
  useEffect(() => {
    if (ANALYTICS.faroCollectorUrl) {
      void import("./lib/analytics/faro").then(({ initFaro }) => initFaro());
    }
  }, []);

  return (
    <WorkerProvider>
      <HistoryProvider>
        <BrowserRouter>
          <RouteErrorReset />
          <Shell />
        </BrowserRouter>
      </HistoryProvider>
    </WorkerProvider>
  );
}

function TabElement({ path }: { path: string }) {
  const Comp = TAB_COMPONENTS[path];
  return <Comp />;
}
