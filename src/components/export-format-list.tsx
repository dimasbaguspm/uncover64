import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import type { ExportFormat } from "@/lib/types";
import { EXPORT_FORMATS } from "@/constants/formats";
import { btn, btnActive } from "./ui";

const EXPORT_LABELS: Record<ExportFormat, string> = {
  raw: "export.raw",
  datauri: "export.datauri",
  env: "export.env",
  k8s: "export.k8s",
};

export function ExportFormatList({
  value,
  onChange,
}: {
  value: ExportFormat;
  onChange: (f: ExportFormat) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-2">
      {EXPORT_FORMATS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={clsx(btn, value === f.id && btnActive)}
        >
          {t(EXPORT_LABELS[f.id])}
        </button>
      ))}
    </div>
  );
}
