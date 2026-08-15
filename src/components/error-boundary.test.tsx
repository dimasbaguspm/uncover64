import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./error-boundary";

const logError = vi.fn();
vi.mock("@/lib/analytics/otel", () => ({ logError: (...args: unknown[]) => logError(...args) }));

function Bomb(): never {
  throw new Error("kaboom");
}

describe("ErrorBoundary", () => {
  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <p>fine</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("fine")).toBeInTheDocument();
  });

  it("renders the fallback and logs the error when a child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    expect(screen.getByText(/error was logged/)).toBeInTheDocument();
    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      "React render error",
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });
});
