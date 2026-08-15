import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useSearchParams } from "react-router-dom";
import { trackEvent } from "@/lib/analytics/track";
import { Header } from "./header";

vi.mock("@/lib/analytics/track", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/analytics/otel", () => ({
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
  currentTrace: vi.fn(),
}));

function DrawerProbe() {
  const [params] = useSearchParams();
  return <output>drawer={params.get("drawer") ?? ""}</output>;
}

function renderHeader() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Header />
      <DrawerProbe />
    </MemoryRouter>,
  );
}

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the changelog drawer from the desktop button", async () => {
    const user = userEvent.setup();
    renderHeader();

    expect(screen.getByText("drawer=")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Changelog" }));

    expect(screen.getByText("drawer=changelog")).toBeInTheDocument();
  });

  it("opens the changelog drawer from the mobile menu item", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("menuitem", { name: "Changelog" }));

    expect(screen.getByText("drawer=changelog")).toBeInTheDocument();
  });

  it("tracks nav_github when the GitHub badge is clicked", async () => {
    const user = userEvent.setup();
    renderHeader();

    const badge = screen.getByRole("link", { name: "GitHub" });
    expect(badge).toHaveAttribute("href", "https://github.com/dimasbaguspm/uncover64");
    expect(badge).toHaveAttribute("target", "_blank");

    await user.click(badge);
    expect(trackEvent).toHaveBeenCalledWith("nav_github");
  });

  it("does not track nav_github for other interactions", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: "Changelog" }));

    expect(trackEvent).not.toHaveBeenCalled();
  });
});
