import type { ComponentType } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components/error-boundary";
import { ROUTES } from "@/constants/routes";
import AssetPage from "@/pages/asset-page";
import CompressionPage from "@/pages/compression-page";
import DecodePage from "@/pages/decode";
import EncodePage from "@/pages/encode";

const TAB_COMPONENTS: Record<string, ComponentType> = {
  "/": EncodePage,
  "/decode": DecodePage,
};

function TabElement({ path }: { path: string }) {
  const Comp = TAB_COMPONENTS[path];
  return (
    <ErrorBoundary>
      <Comp />
    </ErrorBoundary>
  );
}

export function AppRoutes() {
  return (
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
  );
}
