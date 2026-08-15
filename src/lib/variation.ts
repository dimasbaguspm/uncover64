import type { CompressFormat } from "./types";

export const RAW_KEY = "raw";

export function variationKey(algorithm: CompressFormat | null, quality?: number): string {
  if (algorithm === null) return RAW_KEY;
  return quality !== undefined ? `${algorithm}:${quality}` : algorithm;
}

export interface ParsedVariationKey {
  algorithm: CompressFormat | null;
  quality: number | null;
}

export function parseVariationKey(key: string): ParsedVariationKey {
  if (key === RAW_KEY) return { algorithm: null, quality: null };
  const [algorithm, q] = key.split(":");
  return {
    algorithm: algorithm as CompressFormat,
    quality: q === undefined ? null : Number(q),
  };
}
