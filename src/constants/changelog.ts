export interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.3.0",
    date: "2026-08-15",
    items: [
      "Navy theme with light/dark toggle",
      "Upload-first workflow with Advanced forms",
      "Drag & drop everywhere",
      "EN/ID localization",
      "Searchable tips and changelog drawer",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-08-15",
    items: [
      "Web Worker core with transferable objects",
      "Compression: gzip, deflate, brotli",
      "Magic-byte inspection, JWT, and image optimizer",
      "Node.js / Go decode snippets",
      "Export as data URI, .env-safe, or K8s Secret",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-08-14",
    items: ["Base64 encode/decode", "Installable PWA"],
  },
];
