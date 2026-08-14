import type { ExportFormat } from "../lib/types";

export const EXPORT_FORMATS: { id: ExportFormat; label: string }[] = [
  { id: "raw", label: "Raw" },
  { id: "datauri", label: "Data URI" },
  { id: "env", label: ".env" },
  { id: "k8s", label: "K8s Secret" },
];

export const ENV_LINE_WIDTH = 64;

export const DEFAULT_SECRET_NAME = "my-secret";
export const DEFAULT_SECRET_KEY = "data";
