import type { ComponentType, ReactNode } from "react";
import { ErrorBoundary } from "./error-boundary";

export function withErrorBoundary<P extends object>(Component: ComponentType<P>) {
  return function WithErrorBoundary(props: P): ReactNode {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
