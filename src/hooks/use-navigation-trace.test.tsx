import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics/track", () => ({
  trackEvent: vi.fn(),
}));
vi.mock("@/lib/analytics/otel", () => ({
  logInfo: vi.fn(),
  currentTrace: vi.fn(() => null),
}));

import { currentTrace, logInfo } from "@/lib/analytics/otel";
import { trackEvent } from "@/lib/analytics/track";
import { useNavigationTrace } from "./use-navigation-trace";

let navigateRef: ((path: string) => void) | null = null;

function Probe() {
  useNavigationTrace();
  navigateRef = useNavigate();
  return <Link to="/decode">Go decode</Link>;
}

function renderProbe() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Probe />
    </MemoryRouter>,
  );
}

describe("useNavigationTrace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateRef = null;
  });

  it("tracks page_navigate with the masked path when the route changes", async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole("link", { name: "Go decode" }));
    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith("page_navigate", { path: "/decode" }),
    );
    expect(logInfo).toHaveBeenCalledWith("page navigate", {
      path: "/decode",
      traceId: "",
      spanId: "",
    });
  });

  it("attaches the click-time trace to the navigate log", async () => {
    const trace = { traceId: "a".repeat(32), spanId: "b".repeat(16) };
    vi.mocked(currentTrace).mockReturnValue(trace);
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole("link", { name: "Go decode" }));
    await waitFor(() =>
      expect(logInfo).toHaveBeenCalledWith("page navigate", {
        path: "/decode",
        traceId: trace.traceId,
        spanId: trace.spanId,
      }),
    );
  });

  it("clears the captured trace after consuming it", async () => {
    const trace = { traceId: "a".repeat(32), spanId: "b".repeat(16) };
    vi.mocked(currentTrace).mockReturnValue(trace);
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole("link", { name: "Go decode" }));
    await waitFor(() =>
      expect(logInfo).toHaveBeenCalledWith("page navigate", {
        path: "/decode",
        traceId: trace.traceId,
        spanId: trace.spanId,
      }),
    );

    act(() => navigateRef?.("/encode"));
    await waitFor(() =>
      expect(logInfo).toHaveBeenCalledWith("page navigate", {
        path: "/encode",
        traceId: "",
        spanId: "",
      }),
    );
  });
});
