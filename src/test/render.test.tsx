import { screen } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "./render";

function RouterProbe() {
  const { pathname } = useLocation();
  return <output>path={pathname}</output>;
}

describe("renderWithProviders", () => {
  it("renders children inside a router at the default route", () => {
    renderWithProviders(<div>hello</div>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("starts at the requested route", () => {
    renderWithProviders(<RouterProbe />, { route: "/decode" });
    expect(screen.getByText("path=/decode")).toBeInTheDocument();
  });
});
