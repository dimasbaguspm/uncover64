import i18n from "@/i18n";
import { trackEvent } from "@/lib/analytics/track";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Footer } from "./footer";

vi.mock("@/lib/analytics/track", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/analytics/otel", () => ({
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
  currentTrace: vi.fn(),
}));

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
  key(index: number) {
    return [...this.store.keys()][index] ?? null;
  }
}

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );
}

describe("Footer", () => {
  const storage = new MemoryStorage();

  beforeEach(() => {
    vi.clearAllMocks();
    storage.clear();
    vi.stubGlobal("localStorage", storage);
    document.documentElement.className = "";
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await i18n.changeLanguage("en");
  });

  it("opens history and tracks the event", async () => {
    const user = userEvent.setup();
    renderFooter();

    await user.click(screen.getByRole("button", { name: "Saved history" }));

    expect(trackEvent).toHaveBeenCalledWith("history_open");
  });

  it("toggles the theme and tracks the event", async () => {
    const user = userEvent.setup();
    renderFooter();

    await user.click(screen.getByRole("button", { name: "Theme" }));

    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(trackEvent).toHaveBeenCalledWith("theme_toggle", { theme: "light" });
  });

  it("shows both languages in the desktop select and tracks changes", async () => {
    const user = userEvent.setup();
    renderFooter();

    const select = screen.getByLabelText("Language");
    expect(screen.getByRole("option", { name: "EN" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "ID" })).toBeInTheDocument();

    await user.selectOptions(select, "id");
    expect(trackEvent).toHaveBeenCalledWith("language_select", { code: "id" });
  });

  it("renders the site link and tracks footer_link clicks", async () => {
    const user = userEvent.setup();
    renderFooter();

    const link = screen.getByRole("link", { name: /uncover64/ });
    expect(link).toHaveAttribute("href", "https://uncover64.dimasbaguspm.dev");

    await user.click(link);
    expect(trackEvent).toHaveBeenCalledWith("footer_link", {
      url: "https://uncover64.dimasbaguspm.dev",
    });
  });

  it("mobile menu exposes feedback and a nested language list", async () => {
    const user = userEvent.setup();
    renderFooter();

    await user.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByRole("menuitem", { name: "Feedback" })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Language" }));
    expect(screen.getByRole("menuitem", { name: "EN" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "ID" })).toBeInTheDocument();
  });
});
