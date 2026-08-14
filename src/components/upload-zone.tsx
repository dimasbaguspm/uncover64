import { UploadCloud } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

export function UploadZone({ title, onFile }: { title: string; onFile: (file: File) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex w-full flex-1 flex-col items-center justify-center gap-3 border-2 border-dashed border-edge px-6 py-16 text-center transition-colors hover:border-accent/60 hover:bg-accent/5"
    >
      <UploadCloud className="size-12 text-accent" aria-hidden />
      <p className="text-lg font-medium text-ink">{title}</p>
      <p className="text-sm text-faint">{t("common.clickBrowse")}</p>
      <p className="text-xs text-faint">{t("encode.support")}</p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </button>
  );
}
