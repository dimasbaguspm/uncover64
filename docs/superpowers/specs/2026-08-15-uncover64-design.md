# Uncover64 — Zero-Knowledge Base64 Toolkit (Design)

Date: 2026-08-15

## Purpose

A developer-focused Base64 encoder/decoder that goes beyond the standard text
box. It handles the size problem (pre-compression), smart payload detection
(magic bytes), and local-first privacy (Web Workers, zero servers).

## Core constraints

1. **100% client-side.** No backend. Data never leaves the browser.
2. **Zero UI blocking.** All heavy work happens in a Web Worker; large payloads
   transferred with `Transferable` objects (zero-copy).
3. **Installable PWA**, so it works offline.

## Approach

- **Single core worker** (`src/worker/core.worker.ts`) handling encode, decode,
  compress/decompress, magic-byte detection, and image downscaling.
- **Main thread** handles React UI, blob-URL previews, and export formatting.
- **Promise-based worker bridge** (`workerClient.ts`): each request gets an id;
  responses resolve matching promises.
- **Compression:**
  - Gzip / Deflate via native `CompressionStream` / `DecompressionStream`.
  - Brotli via lazy-loaded `brotli-wasm` (WASM), with async/sync fallback so it
    works in both browser and Node test environments.
- **Image downscaling:** `createImageBitmap` + `OffscreenCanvas` in the worker,
  re-encoded to JPEG or WebP at a configurable quality.

## UI

Three tabs, dark developer theme (zinc + emerald accent):

1. **Encode** — text or file input; compression selector (None/Gzip/Deflate/
   Brotli); size-comparison cards + savings banner; export format selector
   (Raw / Data URI / `.env` / K8s Secret); Node.js + Go decode snippets when
   compression is used.
2. **Decode** — paste base64 / data URI / JWT; decompress selector
   (Auto / Gzip / Deflate / Brotli / Off); result rendered as text, image,
   PDF preview, or downloadable binary with detected extension.
3. **Inspect** — same decode path plus an image optimizer panel
   (max width, quality, JPEG/WebP) that reports savings and re-exportable output.

## Data flow

UI → `workerClient.postMessage({ id, type, payload }, [transferables])` → worker
dispatches to an `op*` function → replies `{ id, ok, result | error }`.

## Error handling

- Worker catches all errors and returns `{ ok: false, error: string }`.
- Main thread renders an inline error banner with the failing step.
- Invalid base64 → specific error. Brotli / OffscreenCanvas unavailability →
  clear message; compression degrades to available formats.

## Testing

Vitest + Testing Library (jsdom).

- `base64.test.ts` — roundtrips, base64url, normalization, JWT shape.
- `detect.test.ts` — magic-byte signatures.
- `export.test.ts` — formatting (bytes, data URI, env wrap, K8s YAML).
- `ops.test.ts` — encode/decode roundtrips (raw/gzip/deflate/brotli), JWT
  parsing, downscale via stubbed `OffscreenCanvas`, unavailable-API errors.
- `App.test.tsx` — renders brand + tabs, tab switching.

`brotli-wasm` is mocked in tests with the package's Node build via `vi.mock`
so real Brotli roundtrips run in CI without a browser.

## Deliverables

- Vite + React + TS + Tailwind v4 app, `vite-plugin-pwa` for offline install.
- Web Worker core with transferable messaging.
- All three tabs, export formats, and snippets.
- PWA manifest + service worker generated at build time.
