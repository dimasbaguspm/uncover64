import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import "@/i18n";
import { HistoryProvider } from "@/providers/history-provider";
import { AppRoutes } from "./app-routes";

vi.mock("@/lib/analytics/track", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/analytics/otel", () => ({
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
  currentTrace: vi.fn(),
}));

function renderRoutes(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <HistoryProvider>
        <AppRoutes />
      </HistoryProvider>
    </MemoryRouter>,
  );
}

describe("AppRoutes", () => {
  it("renders the decode page at /decode", async () => {
    renderRoutes("/decode");
    expect(await screen.findByPlaceholderText(/Paste base64/)).toBeInTheDocument();
  });

  it("renders the encode page at /", async () => {
    renderRoutes("/");
    expect(await screen.findByText(/Drop a file to encode it as base64/)).toBeInTheDocument();
  });
});
