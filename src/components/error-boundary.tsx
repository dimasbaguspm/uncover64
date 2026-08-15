import { Component, type ErrorInfo, type ReactNode } from "react";
import { sendOtlpLog } from "../lib/analytics/otel";

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void sendOtlpLog("error", "error", {
      message: error.message,
      stack: error.stack ?? "",
      componentStack: info.componentStack ?? "",
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center p-6">
          <div className="rounded-lg border border-[var(--tint-rose-bd)] bg-[var(--tint-rose-bg)] px-4 py-3 text-sm text-[var(--tint-rose-fg)]">
            Something went wrong. The error was logged.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
