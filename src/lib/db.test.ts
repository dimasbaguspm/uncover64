import { beforeEach, describe, expect, it } from "vitest";
import { getDb, newId } from "./db";

async function clearDb() {
  await getDb().assets.clear();
  await getDb().compressions.clear();
  await getDb().payloads.clear();
}

describe("db", () => {
  beforeEach(async () => {
    await clearDb();
  });

  it("generates a uuid per id", () => {
    expect(newId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(newId()).not.toBe(newId());
  });

  it("exposes a singleton database", () => {
    expect(getDb()).toBe(getDb());
  });

  it("round-trips assets", async () => {
    const db = getDb();
    const id = await db.assets.add({
      uuid: newId(),
      name: "a.txt",
      mime: "text/plain",
      kind: "text",
      sizeBytes: 5,
      rawText: "hello",
      bytes: new Uint8Array([1, 2, 3]),
      createdAt: 1,
    });

    const row = await db.assets.get(id);
    expect(row?.name).toBe("a.txt");
    expect(Array.from(row!.bytes)).toEqual([1, 2, 3]);
    await db.assets.delete(id);
    expect(await db.assets.toArray()).toHaveLength(0);
  });

  it("round-trips compressions with variations", async () => {
    const db = getDb();
    const id = await db.compressions.add({
      uuid: newId(),
      assetId: "asset-1",
      name: "a.txt",
      mime: "text/plain",
      kind: "text",
      rawSizeBytes: 1000,
      rawBase64Length: 1360,
      rawText: "",
      variations: [{ algorithm: "gzip", quality: 70, byteLength: 400, base64Length: 544, ms: 5 }],
      createdAt: 1,
    });

    const row = await db.compressions.get(id);
    expect(row?.variations).toEqual([
      { algorithm: "gzip", quality: 70, byteLength: 400, base64Length: 544, ms: 5 },
    ]);
    const byAsset = await db.compressions.where("assetId").equals("asset-1").toArray();
    expect(byAsset).toHaveLength(1);
  });

  it("round-trips payloads on the composite key", async () => {
    const db = getDb();
    await db.payloads.bulkAdd([
      { encodeId: "comp-1", algorithm: "raw", base64: "aGVsbG8=" },
      { encodeId: "comp-1", algorithm: "gzip:70", base64: "b64-70" },
    ]);

    expect(await db.payloads.get(["comp-1", "raw"])).toMatchObject({ base64: "aGVsbG8=" });
    expect(await db.payloads.get(["comp-1", "gzip:70"])).toMatchObject({ base64: "b64-70" });
    expect(await db.payloads.where("encodeId").equals("comp-1").toArray()).toHaveLength(2);
  });
});
