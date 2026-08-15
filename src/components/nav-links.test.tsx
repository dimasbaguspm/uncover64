import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import "@/i18n";
import { NavLinks } from "./nav-links";

function renderLinks(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <NavLinks />
    </MemoryRouter>,
  );
}

describe("NavLinks", () => {
  it("renders every route as a link with the right destination", () => {
    renderLinks();
    expect(screen.getByRole("link", { name: "Encode" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Decode" })).toHaveAttribute("href", "/decode");
  });

  it("marks the active route and updates it on navigation", async () => {
    const user = userEvent.setup();
    renderLinks("/");
    expect(screen.getByRole("link", { name: "Encode" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Decode" })).not.toHaveAttribute("aria-current");

    await user.click(screen.getByRole("link", { name: "Decode" }));
    expect(screen.getByRole("link", { name: "Decode" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Encode" })).not.toHaveAttribute("aria-current");
  });
});
