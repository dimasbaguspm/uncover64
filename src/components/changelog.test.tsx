import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Changelog } from "./changelog";

describe("Changelog", () => {
  it("renders every version header with its date", () => {
    render(<Changelog />);
    expect(screen.getByText("v0.3.0")).toBeInTheDocument();
    expect(screen.getByText("v0.2.0")).toBeInTheDocument();
    expect(screen.getByText("v0.1.0")).toBeInTheDocument();
  });

  it("renders the changelog bullet items", () => {
    render(<Changelog />);
    expect(screen.getByText("Navy theme with light/dark toggle")).toBeInTheDocument();
    expect(screen.getByText("Web Worker core with transferable objects")).toBeInTheDocument();
    expect(screen.getByText("Base64 encode/decode")).toBeInTheDocument();
  });
});
