import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "@/i18n";
import { LanguageSwitcher } from "./language-switcher";

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("LanguageSwitcher", () => {
  it("select variant shows every language option", () => {
    render(<LanguageSwitcher variant="select" />);
    const select = screen.getByLabelText("Language");
    expect(select).toHaveValue("en");
    expect(screen.getByRole("option", { name: "EN" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "ID" })).toBeInTheDocument();
  });

  it("select variant switches the active locale", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher variant="select" />);
    const select = screen.getByLabelText("Language");

    await user.selectOptions(select, "id");
    expect(select).toHaveValue("id");
    await user.selectOptions(select, "en");
    expect(select).toHaveValue("en");
  });

  it("menu variant opens a nested language list and switches locale", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher variant="menu" />);

    const trigger = screen.getByRole("menuitem", { name: "Language" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "EN" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "ID" })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "ID" }));
    expect(i18n.language).toBe("id");
  });
});
