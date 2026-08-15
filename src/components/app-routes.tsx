import type { ComponentType } from "react";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { PageSuspense } from "./page-suspense";
import { withErrorBoundary } from "./with-error-boundary";

const EncodePage = withErrorBoundary(lazy(() => import("@/pages/encode")));
const DecodePage = withErrorBoundary(lazy(() => import("@/pages/decode")));
const AssetPage = withErrorBoundary(lazy(() => import("@/pages/asset-page")));
const CompressionPage = withErrorBoundary(lazy(() => import("@/pages/compression-page")));

const TAB_COMPONENTS: Record<string, ComponentType> = {
  "/": EncodePage,
  "/decode": DecodePage,
};

function TabElement({ path }: { path: string }) {
  const Comp = TAB_COMPONENTS[path];
  return <Comp />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageSuspense />}>
      <Routes>
        {ROUTES.map((r) => (
          <Route key={r.path} path={r.path} element={<TabElement path={r.path} />} />
        ))}
        <Route path="/encode/:assetId" element={<AssetPage />} />
        <Route path="/encode/:assetId/compress/:compressionId" element={<CompressionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
