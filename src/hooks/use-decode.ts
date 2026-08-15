import { useCallback, useEffect, useState } from "react";
import type { DecodeResult, DecompressOption } from "@/lib/types";
import { useEncoder } from "./use-encoder";

export interface UseDecodeResult {
  input: string;
  setInput: (value: string) => void;
  decompress: DecompressOption;
  setDecompress: (value: DecompressOption) => void;
  result: DecodeResult | null;
  pending: boolean;
  error: string | null;
}

export function useDecode(delay = 350): UseDecodeResult {
  const { decode, error } = useEncoder();
  const [input, setInput] = useState("");
  const [decompress, setDecompress] = useState<DecompressOption>("auto");
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const value = input.trim();
    if (!value) {
      setResult(null);
      setPending(false);
      return;
    }
    setPending(true);
    let cancelled = false;
    const id = setTimeout(async () => {
      const res = await decode(value, decompress);
      if (cancelled) return;
      setPending(false);
      if (res) setResult(res);
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [input, decompress, decode, delay]);

  const setInputSafe = useCallback((value: string) => setInput(value), []);
  const setDecompressSafe = useCallback((value: DecompressOption) => setDecompress(value), []);

  return {
    input,
    setInput: setInputSafe,
    decompress,
    setDecompress: setDecompressSafe,
    result,
    pending,
    error,
  };
}
