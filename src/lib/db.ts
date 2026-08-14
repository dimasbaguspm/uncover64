import Dexie, { type EntityTable, type Table } from "dexie";
import { base64ToBytes } from "./base64";
import type { CompressFormat } from "./types";

export interface HistoryVariation {
  algorithm: CompressFormat;
  quality: number;
  byteLength: number;
  base64Length: number;
  ms: number;
}

export interface HistoryRecord {
  id?: number;
  uuid: string;
  createdAt: number;
  name: string;
  mime: string;
  kind: string;
  rawSizeBytes: number;
  rawBase64Length: number;
  rawText: string;
  variations: HistoryVariation[];
  bytes?: Uint8Array;
}

export interface VariationPayload {
  encodeId: string;
  algorithm: string;
  base64: string;
}

export type PayloadInput = { algorithm: string; base64: string };

export function newId(): string {
  return crypto.randomUUID();
}

interface LegacyVariation extends HistoryVariation {
  base64?: string;
}

interface LegacyRecord {
  id?: number;
  uuid: string;
  createdAt: number;
  name: string;
  mime: string;
  kind: string;
  rawSizeBytes: number;
  rawBase64Length: number;
  rawText: string;
  variations?: LegacyVariation[];
  bytes?: Uint8Array;
  base64?: string;
}

class UncoverDB extends Dexie {
  history!: EntityTable<HistoryRecord, "id">;
  payloads!: Table<VariationPayload, [string, string]>;

  constructor() {
    super("uncover64");
    this.version(1).stores({ history: "++id, createdAt, name, mime" });
    this.version(2)
      .stores({ history: "++id, createdAt, name, mime, uuid" })
      .upgrade((tx) =>
        tx
          .table<LegacyRecord, number>("history")
          .toCollection()
          .modify((rec) => {
            if (!rec.uuid) rec.uuid = newId();
          }),
      );
    this.version(3)
      .stores({
        history: "++id, createdAt, name, mime, uuid",
        payloads: "[encodeId+algorithm], encodeId",
      })
      .upgrade(async (tx) => {
        const payloads = tx.table<VariationPayload, "[encodeId+algorithm]">("payloads");
        const rows: VariationPayload[] = [];
        await tx
          .table<LegacyRecord, number>("history")
          .toCollection()
          .each((rec) => {
            if (rec.base64) {
              rows.push({ encodeId: rec.uuid, algorithm: "raw", base64: rec.base64 });
              if (!rec.bytes) rec.bytes = base64ToBytes(rec.base64);
            }
            for (const v of rec.variations ?? []) {
              if (v.base64) {
                rows.push({ encodeId: rec.uuid, algorithm: v.algorithm, base64: v.base64 });
              }
            }
          });
        if (rows.length) await payloads.bulkAdd(rows);
      });
  }
}

let _db: UncoverDB | null = null;

export function getDb(): UncoverDB {
  if (!_db) _db = new UncoverDB();
  return _db;
}
