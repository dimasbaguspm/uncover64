import type { ExportFormat } from "./types";
import { ENV_LINE_WIDTH } from "@/constants/formats";
import { logInfo } from "@/lib/analytics/otel";

export function toDataUri(base64: string, mime: string): string {
  return `data:${mime};base64,${base64}`;
}

export function toEnvSafe(base64: string, width: number = ENV_LINE_WIDTH): string {
  const lines: string[] = [];
  for (let i = 0; i < base64.length; i += width) {
    lines.push(base64.slice(i, i + width));
  }
  return lines.join("\n");
}

export function toK8sSecretYAML(secretName: string, key: string, base64: string): string {
  const body = toEnvSafe(base64);
  return [
    `apiVersion: v1`,
    `kind: Secret`,
    `metadata:`,
    `  name: ${secretName}`,
    `type: Opaque`,
    `stringData:`,
    `  ${key}: |`,
    ...body.split("\n").map((l) => `    ${l}`),
    ``,
  ].join("\n");
}

export function exportValue(
  format: ExportFormat,
  base64: string,
  mime: string,
  secretName: string,
  key: string,
): string {
  logInfo("export", { format, length: base64.length, mime });
  switch (format) {
    case "datauri":
      return toDataUri(base64, mime);
    case "env":
      return toEnvSafe(base64);
    case "k8s":
      return toK8sSecretYAML(secretName, key, base64);
    default:
      return base64;
  }
}
