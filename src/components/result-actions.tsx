import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { downloadBlob } from "@/lib/utils/download";
import { CopyButton, btn } from "./ui";

export function ResultActions({
  isJson,
  pretty,
  onTogglePretty,
  text,
  mime,
  ext,
  bytes,
}: {
  isJson: boolean;
  pretty: boolean;
  onTogglePretty: () => void;
  text: string;
  mime: string;
  ext: string;
  bytes: Uint8Array;
}) {
  const { t } = useTranslation();
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <div>
        {isJson && (
          <button
            type="button"
            onClick={onTogglePretty}
            className={clsx(btn, "!px-2 !py-1 text-xs")}
          >
            {pretty ? t("result.minify") : t("result.pretty")}
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <CopyButton value={text} />
        <button
          type="button"
          onClick={() => downloadBlob(bytes, mime, `decoded.${ext}`)}
          className={btn}
        >
          {t("result.download")}
        </button>
      </div>
    </div>
  );
}
