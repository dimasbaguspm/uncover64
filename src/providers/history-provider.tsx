import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getDb, newId, type HistoryRecord, type PayloadInput } from "../lib/db";

interface HistoryContextValue {
  records: HistoryRecord[];
  ready: boolean;
  refresh: () => Promise<void>;
  add: (
    rec: Omit<HistoryRecord, "id" | "createdAt" | "uuid">,
    payloads: PayloadInput[],
  ) => Promise<HistoryRecord>;
  getBase64: (encodeId: string, algorithm: string) => Promise<string | null>;
  remove: (id: number) => Promise<void>;
  clear: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [ready, setReady] = useState(false);
  const cacheRef = useRef<Map<string, string>>(new Map());

  const refresh = useCallback(async () => {
    const list = await getDb().history.orderBy("createdAt").reverse().toArray();
    setRecords(list);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (rec: Omit<HistoryRecord, "id" | "createdAt" | "uuid">, payloads: PayloadInput[]) => {
      const createdAt = Date.now();
      const full: HistoryRecord = { ...rec, uuid: newId(), createdAt };
      const id = await getDb().history.add(full);
      const saved: HistoryRecord = { ...full, id };
      if (payloads.length) {
        await getDb().payloads.bulkAdd(
          payloads.map((p) => ({ encodeId: saved.uuid, algorithm: p.algorithm, base64: p.base64 })),
        );
      }
      setRecords((prev) => [saved, ...prev]);
      return saved;
    },
    [],
  );

  const getBase64 = useCallback(async (encodeId: string, algorithm: string) => {
    const key = `${encodeId}\u0000${algorithm}`;
    const cached = cacheRef.current.get(key);
    if (cached !== undefined) return cached;
    const row = await getDb().payloads.get([encodeId, algorithm]);
    const b64 = row?.base64 ?? null;
    if (b64) cacheRef.current.set(key, b64);
    return b64;
  }, []);

  const remove = useCallback(
    async (id: number) => {
      const rec = records.find((r) => r.id === id);
      await getDb().history.delete(id);
      if (rec) {
        await getDb().payloads.where("encodeId").equals(rec.uuid).delete();
        for (const key of cacheRef.current.keys()) {
          if (key.startsWith(`${rec.uuid}\u0000`)) cacheRef.current.delete(key);
        }
      }
      setRecords((prev) => prev.filter((r) => r.id !== id));
    },
    [records],
  );

  const clear = useCallback(async () => {
    await getDb().history.clear();
    await getDb().payloads.clear();
    cacheRef.current.clear();
    setRecords([]);
  }, []);

  const value = useMemo<HistoryContextValue>(
    () => ({ records, ready, refresh, add, getBase64, remove, clear }),
    [records, ready, refresh, add, getBase64, remove, clear],
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used within a HistoryProvider");
  return ctx;
}
