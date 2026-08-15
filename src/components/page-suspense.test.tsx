import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageSuspense } from "./page-suspense";

describe("PageSuspense", () => {
  it("renders a centered spinner", () => {
    const { container } = render(<PageSuspense />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("flex");
  });
});
