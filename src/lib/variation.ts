import type { CompressFormat } from "./types";

/** Stable key for a variation/payload: "raw" or "<algo>:<quality>". */
export function variationKey(algorithm: CompressFormat | null, quality?: number): string {
  if (algorithm === null) return "raw";
  return quality !== undefined ? `${algorithm}:${quality}` : algorithm;
}
