import Dexie, { type EntityTable, type Table } from "dexie";
import type { CompressFormat } from "./types";

export interface HistoryVariation {
  algorithm: CompressFormat;
  quality: number;
  byteLength: number;
  base64Length: number;
  ms: number;
}

/** An uploaded asset — preserved once uploaded, before any encode options. */
export interface Asset {
  id?: number;
  uuid: string;
  name: string;
  mime: string;
  kind: string;
  sizeBytes: number;
  rawText: string;
  bytes: Uint8Array;
  createdAt: number;
}

/** A set of encoded variations for a given asset. */
export interface CompressionRecord {
  id?: number;
  uuid: string;
  assetId: string;
  name: string;
  mime: string;
  kind: string;
  rawSizeBytes: number;
  rawBase64Length: number;
  rawText: string;
  variations: HistoryVariation[];
  createdAt: number;
}

export interface VariationPayload {
  encodeId: string;
  algorithm: string;
  base64: string;
}

export function newId(): string {
  return crypto.randomUUID();
}

class UncoverDB extends Dexie {
  assets!: EntityTable<Asset, "id">;
  compressions!: EntityTable<CompressionRecord, "id">;
  payloads!: Table<VariationPayload, [string, string]>;

  constructor() {
    super("uncover64");
    this.version(1).stores({
      assets: "++id, uuid, createdAt",
      compressions: "++id, uuid, assetId, createdAt",
      payloads: "[encodeId+algorithm], encodeId",
    });
  }
}

let _db: UncoverDB | null = null;

export function getDb(): UncoverDB {
  if (!_db) _db = new UncoverDB();
  return _db;
}
