import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/components/app-routes";
import { Changelog } from "@/components/changelog";
import { Drawer } from "@/components/drawer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { HistoryDrawer } from "@/components/history-drawer";
import { useAppBoot } from "@/hooks/use-app-boot";
import { useNavigationTrace } from "@/hooks/use-navigation-trace";
import { useQueryParam } from "@/hooks/use-query-param";
import { trackEvent } from "@/lib/analytics/track";
import { HistoryProvider } from "@/providers/history-provider";

function RouteTracker() {
  useNavigationTrace();
  return null;
}

function Shell() {
  const { t } = useTranslation();
  const [drawer, setDrawer] = useQueryParam("drawer");

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
        <Header />
        <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
          <AppRoutes />
        </main>
        <Footer />
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
