import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DropdownMenu, MenuItem, NestedMenuItem } from "./dropdown-menu";

function renderMenu() {
  return render(
    <DropdownMenu label="More" trigger={<span>More</span>}>
      <MenuItem onClick={vi.fn()}>Item One</MenuItem>
      <NestedMenuItem label="Nested" open={false} onOpen={vi.fn()}>
        <button type="button">Nested item</button>
      </NestedMenuItem>
    </DropdownMenu>,
  );
}

describe("DropdownMenu", () => {
  it("closes the menu when a MenuItem is clicked", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByRole("menuitem", { name: "Item One" })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Item One" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the menu when Escape is pressed", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the menu when clicking outside", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("keeps the parent menu open when a NestedMenuItem is toggled", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("menuitem", { name: "Nested" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });
});
