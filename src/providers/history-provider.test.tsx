import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { EncodeAllResult, FileInfo } from "@/lib/types";
import { getDb } from "@/lib/db";
import { HistoryProvider, useHistory } from "./history-provider";

const info: FileInfo = { kind: "text", mime: "text/plain", ext: "txt", label: "TXT" };

function encodeResult(): EncodeAllResult {
  return {
    base64: "aGVsbG8=",
    mime: "text/plain",
    kind: "text",
    rawSizeBytes: 5,
    rawBase64Length: 8,
    variations: [
      { algorithm: "gzip", quality: 70, byteLength: 4, base64Length: 8, base64: "base64-70", ms: 5 },
    ],
    ms: 5,
  };
}

async function renderReady() {
  const utils = renderHook(() => useHistory(), { wrapper: HistoryProvider });
  await waitFor(() => expect(utils.result.current.ready).toBe(true));
  return utils;
}

beforeEach(async () => {
  await getDb().assets.clear();
  await getDb().compressions.clear();
  await getDb().payloads.clear();
});

describe("HistoryProvider", () => {
  it("exposes an empty ready state", async () => {
    const { result } = await renderReady();
    expect(result.current.assets).toEqual([]);
    expect(result.current.compressions).toEqual([]);
  });

  it("adds an asset and lists it", async () => {
    const { result } = await renderReady();
    const bytes = new TextEncoder().encode("hello");

    let asset;
    await act(async () => {
      asset = await result.current.addAsset("a.txt", bytes, info);
    });

    expect(asset.name).toBe("a.txt");
    expect(asset.uuid).toMatch(/^[0-9a-f-]{36}$/);
    expect(asset.kind).toBe("text");
    expect(result.current.assets).toHaveLength(1);
    expect(result.current.getAsset(asset.uuid)).toBe(asset);
  });

  it("adds a compression with its payloads and reads base64 back", async () => {
    const { result } = await renderReady();
    const bytes = new TextEncoder().encode("hello");
    let asset;
    await act(async () => {
      asset = await result.current.addAsset("a.txt", bytes, info);
    });

    let comp;
    await act(async () => {
      comp = await result.current.addCompression(asset.uuid, "a.txt", encodeResult());
    });

    expect(comp.variations).toHaveLength(1);
    expect(result.current.compressionsForAsset(asset.uuid)).toHaveLength(1);

    const raw = await act(() => result.current.getBase64(comp.uuid, "raw"));
    expect(raw).toBe("aGVsbG8=");
    const gzip = await act(() => result.current.getBase64(comp.uuid, "gzip:70"));
    expect(gzip).toBe("base64-70");
  });

  it("caches base64 lookups", async () => {
    const { result } = await renderReady();
    let asset;
    await act(async () => {
      asset = await result.current.addAsset("a.txt", new TextEncoder().encode("hi"), info);
    });
    let comp;
    await act(async () => {
      comp = await result.current.addCompression(asset.uuid, "a.txt", encodeResult());
    });

    const first = await act(() => result.current.getBase64(comp.uuid, "raw"));
    await act(async () => {
      await getDb().payloads.clear();
    });
    const second = await act(() => result.current.getBase64(comp.uuid, "raw"));
    expect(first).toBe("aGVsbG8=");
    expect(second).toBe("aGVsbG8=");
  });

  it("removes an asset together with its compressions", async () => {
    const { result } = await renderReady();
    let asset;
    await act(async () => {
      asset = await result.current.addAsset("a.txt", new TextEncoder().encode("hello"), info);
    });
    await act(async () => {
      await result.current.addCompression(asset.uuid, "a.txt", encodeResult());
    });

    await act(async () => {
      await result.current.removeAsset(asset.id!);
    });

    expect(result.current.assets).toHaveLength(0);
    expect(result.current.compressions).toHaveLength(0);
    expect(await getDb().assets.toArray()).toHaveLength(0);
    expect(await getDb().compressions.toArray()).toHaveLength(0);
    expect(await getDb().payloads.toArray()).toHaveLength(0);
  });

  it("removes a single compression but keeps the asset", async () => {
    const { result } = await renderReady();
    let asset;
    await act(async () => {
      asset = await result.current.addAsset("a.txt", new TextEncoder().encode("hello"), info);
    });
    let comp;
    await act(async () => {
      comp = await result.current.addCompression(asset.uuid, "a.txt", encodeResult());
    });

    await act(async () => {
      await result.current.removeCompression(comp.id!);
    });

    expect(result.current.assets).toHaveLength(1);
    expect(result.current.compressions).toHaveLength(0);
  });

  it("clears all assets, compressions and payloads", async () => {
    const { result } = await renderReady();
    let asset;
    await act(async () => {
      asset = await result.current.addAsset("a.txt", new TextEncoder().encode("hello"), info);
    });
    await act(async () => {
      await result.current.addCompression(asset.uuid, "a.txt", encodeResult());
    });

    await act(async () => {
      await result.current.clear();
    });

    expect(result.current.assets).toHaveLength(0);
    expect(result.current.compressions).toHaveLength(0);
    expect(await getDb().payloads.toArray()).toHaveLength(0);
  });

  it("throws when used outside the provider", () => {
    expect(() => {
      renderHook(() => useHistory());
    }).toThrow(/HistoryProvider/);
  });
});
