import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./app";
import { getDb } from "./lib/db";

beforeEach(async () => {
  await getDb().history.clear();
  window.history.pushState({}, "", "/");
});

afterEach(async () => {
  await getDb().history.clear();
});

/** Render the app and wait for the AppProvider splash to clear. */
async function renderApp() {
  render(<App />);
  await screen.findByRole("link", { name: "Encode" });
}

describe("App", () => {
  it("renders nav links and header/footer actions", async () => {
    await renderApp();
    expect(screen.getByRole("link", { name: "Encode" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Decode" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Diff" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saved history" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Changelog" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Feedback" })).toBeInTheDocument();
  });

  it("shows the upload-first encode landing", async () => {
    await renderApp();
    expect(screen.getByText("Drop a file to encode it as base64")).toBeInTheDocument();
  });

  it("navigates to decode editor and diff page", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByRole("link", { name: "Decode" }));
    expect(screen.getByPlaceholderText(/Paste base64, a data URI/i)).toBeInTheDocument();
    expect(screen.getByText(/Start typing to preview/i)).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Diff" }));
    expect(screen.getByPlaceholderText(/Paste base64 \(A\)/i)).toBeInTheDocument();
  });

  it("opens saved history drawer with empty state", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByRole("button", { name: "Saved history" }));
    expect(screen.getByText("No saved records yet.")).toBeInTheDocument();
  });

  it("renders an encode detail page for a saved record by uuid", async () => {
    const uuid = "11111111-2222-3333-4444-555555555555";
    await getDb().history.add({
      uuid,
      createdAt: Date.now(),
      name: "sample.txt",
      mime: "text/plain",
      kind: "text",
      rawSizeBytes: 5,
      rawBase64Length: 8,
      rawText: "hello",
      variations: [],
    });
    window.history.pushState({}, "", `/encode/${uuid}`);
    await renderApp();
    expect(await screen.findByText("Variations")).toBeInTheDocument();
  });

  it("opens a saved record from the history drawer", async () => {
    const uuid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    await getDb().history.add({
      uuid,
      createdAt: Date.now(),
      name: "sample.txt",
      mime: "text/plain",
      kind: "text",
      rawSizeBytes: 5,
      rawBase64Length: 8,
      rawText: "hello",
      variations: [],
    });
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Saved history" }));
    await user.click(screen.getByRole("button", { name: /sample\.txt/ }));
    expect(await screen.findByText("Variations")).toBeInTheDocument();
  });

  it("redirects unknown routes to home", async () => {
    window.history.pushState({}, "", "/unknown");
    await renderApp();
    expect(await screen.findByText("Drop a file to encode it as base64")).toBeInTheDocument();
  });
});
