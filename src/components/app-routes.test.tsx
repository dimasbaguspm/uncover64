import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { AppRoutes } from "./app-routes";

vi.mock("@/lib/analytics/track", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/analytics/otel", () => ({
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
  currentTrace: vi.fn(),
}));

describe("AppRoutes", () => {
  it("renders the decode page at /decode", async () => {
    renderWithProviders(<AppRoutes />, { route: "/decode" });
    expect(await screen.findByPlaceholderText(/Paste base64/)).toBeInTheDocument();
  });

  it("renders the encode page at /", async () => {
    renderWithProviders(<AppRoutes />, { route: "/" });
    expect(await screen.findByText(/Drop a file to encode it as base64/)).toBeInTheDocument();
  });
});
