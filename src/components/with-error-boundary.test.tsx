import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { withErrorBoundary } from "./with-error-boundary";

vi.mock("@/lib/analytics/otel", () => ({
  logError: vi.fn(),
}));

const Boom = () => {
  throw new Error("page blew up");
};

describe("withErrorBoundary", () => {
  it("renders the child when it does not throw", () => {
    const Safe = withErrorBoundary(() => <p>ok</p>);
    render(<Safe />);
    expect(screen.getByText("ok")).toBeTruthy();
  });

  it("renders a fallback when the child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const Wrapped = withErrorBoundary(Boom);
    render(<Wrapped />);
    expect(screen.getByText(/something went wrong/i)).toBeTruthy();
    vi.restoreAllMocks();
  });
});
