import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./app";
import { getDb } from "@/lib/db";

beforeEach(async () => {
  await getDb().assets.clear();
  await getDb().compressions.clear();
  await getDb().payloads.clear();
  window.history.pushState({}, "", "/");
});

afterEach(async () => {
  await getDb().assets.clear();
  await getDb().compressions.clear();
  await getDb().payloads.clear();
});

async function seedCompression() {
  const assetUuid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  const compUuid = "11111111-2222-3333-4444-555555555555";
  const db = getDb();
  await db.assets.add({
    uuid: assetUuid,
    name: "sample.txt",
    mime: "text/plain",
    kind: "text",
    sizeBytes: 5,
    rawText: "hello",
    bytes: new TextEncoder().encode("hello"),
    createdAt: Date.now(),
  });
  await db.compressions.add({
    uuid: compUuid,
    assetId: assetUuid,
    name: "sample.txt",
    mime: "text/plain",
    kind: "text",
    rawSizeBytes: 5,
    rawBase64Length: 8,
    rawText: "hello",
    variations: [],
    createdAt: Date.now(),
  });
  await db.payloads.add({ encodeId: compUuid, algorithm: "raw", base64: "aGVsbG8=" });
  return { assetUuid, compUuid };
}

/** Render the app and wait for the boot splash to clear. */
async function renderApp() {
  render(<App />);
  await screen.findByRole("link", { name: "Encode" });
}

describe("App", () => {
  it("renders nav links and header/footer actions", async () => {
    await renderApp();
    expect(screen.getByRole("link", { name: "Encode" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Decode" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saved history" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Changelog" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Feedback" }).length).toBeGreaterThan(0);
  });

  it("shows the upload-first encode landing", async () => {
    await renderApp();
    expect(screen.getByText("Drop a file to encode it as base64")).toBeInTheDocument();
  });

  it("navigates to the decode editor", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByRole("link", { name: "Decode" }));
    expect(screen.getByPlaceholderText(/Paste base64, a data URI/i)).toBeInTheDocument();
    expect(screen.getByText(/Start typing to preview/i)).toBeInTheDocument();
  });

  it("opens saved history drawer with empty state", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByRole("button", { name: "Saved history" }));
    expect(screen.getByText("No saved records yet.")).toBeInTheDocument();
  });

  it("renders a compression page for a saved asset", async () => {
    const { assetUuid, compUuid } = await seedCompression();
    window.history.pushState({}, "", `/encode/${assetUuid}/compress/${compUuid}`);
    await renderApp();
    expect(await screen.findByText("Variations")).toBeInTheDocument();
  });

  it("opens a saved asset from the history drawer", async () => {
    await seedCompression();
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Saved history" }));
    await user.click(screen.getByRole("button", { name: /sample\.txt/ }));
    expect(await screen.findByText("sample.txt")).toBeInTheDocument();
    expect(screen.getByText("Compression")).toBeInTheDocument();
  });

  it("redirects unknown routes to home", async () => {
    window.history.pushState({}, "", "/unknown");
    await renderApp();
    expect(await screen.findByText("Drop a file to encode it as base64")).toBeInTheDocument();
  });
});
