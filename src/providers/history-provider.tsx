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
import { getDb, newId, type Asset, type CompressionRecord } from "@/lib/db";
import { variationKey } from "@/lib/variation";
import { utf8Decode } from "@/lib/base64";
import type { EncodeAllResult, FileInfo } from "@/lib/types";

interface HistoryContextValue {
  assets: Asset[];
  compressions: CompressionRecord[];
  ready: boolean;
  getAsset: (uuid: string) => Asset | undefined;
  getCompression: (uuid: string) => CompressionRecord | undefined;
  compressionsForAsset: (assetId: string) => CompressionRecord[];
  addAsset: (name: string, bytes: Uint8Array, info: FileInfo) => Promise<Asset>;
  addCompression: (
    assetId: string,
    name: string,
    res: EncodeAllResult,
  ) => Promise<CompressionRecord>;
  getBase64: (encodeId: string, algorithm: string) => Promise<string | null>;
  removeAsset: (id: number) => Promise<void>;
  removeCompression: (id: number) => Promise<void>;
  clear: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [compressions, setCompressions] = useState<CompressionRecord[]>([]);
  const [ready, setReady] = useState(false);
  const cacheRef = useRef<Map<string, string>>(new Map());

  const refresh = useCallback(async () => {
    const db = getDb();
    const [a, c] = await Promise.all([
      db.assets.toArray(),
      db.compressions.orderBy("createdAt").reverse().toArray(),
    ]);
    setAssets(a);
    setCompressions(c);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getAsset = useCallback((uuid: string) => assets.find((a) => a.uuid === uuid), [assets]);
  const getCompression = useCallback(
    (uuid: string) => compressions.find((c) => c.uuid === uuid),
    [compressions],
  );
  const compressionsForAsset = useCallback(
    (assetId: string) => compressions.filter((c) => c.assetId === assetId),
    [compressions],
  );

  const addAsset = useCallback(async (name: string, bytes: Uint8Array, info: FileInfo) => {
    const createdAt = Date.now();
    const asset: Asset = {
      uuid: newId(),
      name,
      mime: info.mime,
      kind: info.kind,
      sizeBytes: bytes.byteLength,
      rawText: utf8Decode(bytes) ?? "",
      bytes,
      createdAt,
    };
    const id = await getDb().assets.add(asset);
    const saved = { ...asset, id };
    setAssets((prev) => [saved, ...prev]);
    return saved;
  }, []);

  const addCompression = useCallback(
    async (assetId: string, name: string, res: EncodeAllResult) => {
      const createdAt = Date.now();
      const uuid = newId();
      const rec: CompressionRecord = {
        uuid,
        assetId,
        name,
        mime: res.mime,
        kind: res.kind,
        rawSizeBytes: res.rawSizeBytes,
        rawBase64Length: res.rawBase64Length,
        rawText: "",
        variations: res.variations.map((v) => ({
          algorithm: v.algorithm,
          quality: v.quality,
          byteLength: v.byteLength,
          base64Length: v.base64Length,
          ms: v.ms,
        })),
        createdAt,
      };
      const id = await getDb().compressions.add(rec);
      const saved = { ...rec, id };
      await getDb().payloads.bulkAdd([
        { encodeId: uuid, algorithm: "raw", base64: res.base64 },
        ...res.variations.map((v) => ({
          encodeId: uuid,
          algorithm: variationKey(v.algorithm, v.quality),
          base64: v.base64,
        })),
      ]);
      setCompressions((prev) => [saved, ...prev]);
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

  const removeAsset = useCallback(
    async (id: number) => {
      const asset = assets.find((a) => a.id === id);
      if (!asset) return;
      const comps = compressions.filter((c) => c.assetId === asset.uuid);
      await getDb().assets.delete(id);
      for (const c of comps) {
        await getDb().compressions.delete(c.id!);
        await getDb().payloads.where("encodeId").equals(c.uuid).delete();
        for (const key of cacheRef.current.keys()) {
          if (key.startsWith(`${c.uuid}\u0000`)) cacheRef.current.delete(key);
        }
      }
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setCompressions((prev) => prev.filter((c) => c.assetId !== asset.uuid));
    },
    [assets, compressions],
  );

  const removeCompression = useCallback(
    async (id: number) => {
      const rec = compressions.find((c) => c.id === id);
      await getDb().compressions.delete(id);
      if (rec) {
        await getDb().payloads.where("encodeId").equals(rec.uuid).delete();
        for (const key of cacheRef.current.keys()) {
          if (key.startsWith(`${rec.uuid}\u0000`)) cacheRef.current.delete(key);
        }
      }
      setCompressions((prev) => prev.filter((c) => c.id !== id));
    },
    [compressions],
  );

  const clear = useCallback(async () => {
    await getDb().assets.clear();
    await getDb().compressions.clear();
    await getDb().payloads.clear();
    cacheRef.current.clear();
    setAssets([]);
    setCompressions([]);
  }, []);

  const value = useMemo<HistoryContextValue>(
    () => ({
      assets,
      compressions,
      ready,
      getAsset,
      getCompression,
      compressionsForAsset,
      addAsset,
      addCompression,
      getBase64,
      removeAsset,
      removeCompression,
      clear,
    }),
    [
      assets,
      compressions,
      ready,
      getAsset,
      getCompression,
      compressionsForAsset,
      addAsset,
      addCompression,
      getBase64,
      removeAsset,
      removeCompression,
      clear,
    ],
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used within a HistoryProvider");
  return ctx;
}
