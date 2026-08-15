import { useState } from "react";
import type { PreviewData } from "@/components/preview-panel";
import type { Asset, CompressionRecord } from "@/lib/db";
import type { CompressFormat } from "@/lib/types";
import { useHistory } from "@/providers/history-provider";
import { useAsyncEffect } from "./use-async-effect";
import { useEncoder } from "./use-encoder";

export interface UsePreviewResult {
  preview: PreviewData | null;
  previewLoading: boolean;
  exportBase64: string | null;
  base64Loading: boolean;
}

export function usePreview(params: {
  compression: CompressionRecord | null;
  asset: Asset | null;
  selectedId: string;
  variations: { id: string; algorithm: CompressFormat | null }[];
}): UsePreviewResult {
  const { compression, asset, selectedId, variations } = params;
  const { getBase64 } = useHistory();
  const { decode } = useEncoder();
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exportBase64, setExportBase64] = useState<string | null>(null);
  const [base64Loading, setBase64Loading] = useState(false);

  useAsyncEffect(
    async (isActive) => {
      if (!compression || !asset) {
        setPreview(null);
        setPreviewLoading(false);
        return;
      }
      setPreviewLoading(true);
      const sel = variations.find((v) => v.id === selectedId);
      const b64 = await getBase64(compression.uuid, selectedId);
      if (!isActive()) return;
      if (!b64) {
        setPreviewLoading(false);
        return;
      }
      const res = await decode(b64, sel?.algorithm ?? null);
      if (!isActive()) return;
      if (!res) {
        setPreviewLoading(false);
        return;
      }
      setPreview({
        bytes: res.bytes,
        info: res.info,
        sizeBytes: res.sizeBytes,
        image: res.image,
        text: res.text || undefined,
      });
      setPreviewLoading(false);
    },
    [compression, asset, selectedId, variations, getBase64, decode],
  );

  useAsyncEffect(
    async (isActive) => {
      if (!compression) {
        setExportBase64(null);
        setBase64Loading(false);
        return;
      }
      setBase64Loading(true);
      setExportBase64(null);
      const b64 = await getBase64(compression.uuid, selectedId);
      if (!isActive()) return;
      setExportBase64(b64);
      setBase64Loading(false);
    },
    [compression, selectedId, getBase64],
  );

  return { preview, previewLoading, exportBase64, base64Loading };
}
