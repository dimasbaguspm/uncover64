import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Drawer } from "./drawer";

describe("Drawer", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <Drawer open={false} title="Settings" onClose={vi.fn()}>
        body
      </Drawer>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the title and children when open", () => {
    render(
      <Drawer open title="Settings" onClose={vi.fn()}>
        body-content
      </Drawer>,
    );
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("body-content")).toBeInTheDocument();
  });

  it("closes via the close button and the backdrop", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <Drawer open title="Settings" onClose={onClose}>
        body
      </Drawer>,
    );

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(container.querySelector(".bg-black\\/50")!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
