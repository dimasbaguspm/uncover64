import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { detect } from "@/lib/base64";
import { useHistory } from "@/providers/history-provider";
import { useFileDrop } from "@/hooks/use-file-drop";
import { DropOverlay } from "@/components/drop-overlay";
import { UploadZone } from "@/components/upload-zone";
import { Spinner } from "@/components/ui";

export default function EncodePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { addAsset } = useHistory();

  const onFile = useCallback(
    async (file: File) => {
      setLoading(true);
      try {
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        const info = detect(bytes);
        const asset = await addAsset(file.name, bytes, info);
        navigate(`/encode/${asset.uuid}`);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    },
    [addAsset, navigate],
  );

  const isDragging = useFileDrop((f) => void onFile(f));

  return (
    <>
      <DropOverlay active={isDragging} />
      <div className="flex min-h-0 w-full flex-1 flex-col">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="flex flex-1 p-4">
            <UploadZone title={t("encode.dropTitle")} onFile={(f) => void onFile(f)} />
          </div>
        )}
      </div>
    </>
  );
}
