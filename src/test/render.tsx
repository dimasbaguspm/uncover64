import type { ReactElement } from "react";
import { render, type RenderResult } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HistoryProvider } from "@/providers/history-provider";

export function renderWithProviders(
  ui: ReactElement,
  options?: { route?: string },
): RenderResult {
  return render(
    <HistoryProvider>
      <MemoryRouter initialEntries={[options?.route ?? "/"]}>{ui}</MemoryRouter>
    </HistoryProvider>,
  );
}
