import { FileUp } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DropOverlay({ active }: { active: boolean }) {
  const { t } = useTranslation();
  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-canvas/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 border-2 border-dashed border-accent bg-surface px-12 py-10">
        <FileUp className="size-10 text-accent" aria-hidden />
        <p className="text-lg font-medium text-ink">{t("common.dropFile")}</p>
      </div>
    </div>
  );
}
