# Uncover64 — Zero-Knowledge Base64 Toolkit

Encode, decode, compress, and inspect base64 entirely in your browser. Your data
never leaves your machine.

- **100% client-side.** All processing runs in a Web Worker — no servers, no
  uploads, no telemetry.
- **Installable PWA.** Works offline.
- **Web Worker + transferable objects.** Large payloads never freeze the UI.

## Features

| Tab | What it does |
| --- | --- |
| **Encode** | Upload-first (Drop ⇄ Form toggle). Compression variations are computed in parallel by sub-workers; the record is saved to IndexedDB with the original bytes, while each variation's base64 lives in a separate table and is **lazy-loaded only when selected**. The result opens as `/encode/<uuid>` in a draggable 70/30 split: left lists variations, right previews the payload (text/image/video/PDF). The preview toolbar offers zoom/fit, **full screen** (semi-transparent overlay with left/right arrows to navigate variations), and open-in-new-tab (opens the selected variation's base64). |
| **Decode** | Live editor + preview (draggable split, ~70/30): decode-as-you-type with a shimmer while decoding, auto-decompression, and Ctrl+V paste of a base64 file. The preview shows the algorithm used plus the payload (text/image/video/PDF) with zoom and open-in-new-tab. |
| **Inspect** | Upload-first. Magic-byte detection (PNG/JPEG/GIF/WebP/PDF/ZIP/Gzip/WASM/JSON/JWT), JWT header+payload pretty-printing, image preview + **optimize & re-encode** via OffscreenCanvas downscaling. |

**Saved history:** every encode is persisted in IndexedDB (via Dexie). Open the
history drawer from the header to search, reopen, or delete records.

**UX:** upload-first workflow; slim header with bold uppercase page tabs
(ENCODE / DECODE / FILE INSPECTOR) plus history and a More menu (GitHub /
changelog drawer / searchable tips modal). Slim icon-only footer (settings
popover: theme, language, feedback).

**Export formats:** raw base64, data URI, `.env`-safe (64-char wrap), and
Kubernetes Secret YAML.

**Theme:** base `#253031`, secondary `#315659`, text `#BCAB79`, with a
light/dark toggle (persisted, system-aware default). App version (`v2.1`) is
injected at build time via `VITE_APP_VERSION` (see `.env.example`).

**i18n:** English + Bahasa Indonesia via `react-i18next`; language persists in
`localStorage`. Routing uses clean URLs (`BrowserRouter`); set the repo/feedback
URLs in `src/constants/misc.ts` (`GITHUB_URL`, `FEEDBACK_URL`); edit
`src/constants/changelog.ts` for the changelog drawer. The history drawer and
changelog drawer are driven by `?drawer=` query params so browser back/forward
works.

## Architecture

```
src/
├── app.tsx                  # routing (HashRouter: /, /decode, /inspect)
├── pages/                   # route pages: encode, decode, inspect
├── components/              # small reusable parts (ui, export-bar, result-view)
├── hooks/                   # shared hooks (use-clipboard, …)
├── providers/
│   └── worker-provider.tsx  # React context: busy/error + worker operations
├── constants/               # central config (compression, formats, routes, analytics)
├── worker/
│   └── core.worker.ts       # message handler — all heavy work lives here
└── lib/
    ├── base64/              # base64 encoders, magic-byte detection, snippets
    ├── utils/               # formatBytes, toErrorMessage, etc.
    ├── ops.ts               # encode/decode/compress/detect/downscale logic
    ├── export.ts            # data URI / .env / K8s YAML formatting
    ├── worker-client.ts     # promise-based worker bridge (transferables)
    ├── analytics/           # Faro (LGTM) init and event tracking
    └── types.ts             # shared request/response protocol
```

- Compression uses the browser-native `CompressionStream`/`DecompressionStream`
  (gzip/deflate). Brotli is lazy-loaded `brotli-wasm` with a graceful fallback.
- Image downscaling uses `createImageBitmap` + `OffscreenCanvas` inside the worker.
- Routing uses `react-router-dom` (HashRouter) so deep links work offline in the PWA.
- Analytics uses Grafana Faro (self-hosted LGTM stack) for events, logs, and error
  tracking. Configure the collector URL in `.env` — copy `.env.example`. Faro is
  code-split and only loads when a collector URL is configured.

## Development

```bash
npm install
npm run dev        # start dev server
npm run test       # vitest (unit + component)
npm run lint       # oxlint
npm run format     # oxfmt (Oxc formatter)
npm run build      # typecheck + production build (PWA + worker + wasm)
npm run preview    # serve the production build
```

## Privacy promise

No network requests are made with your data. Everything — decode, compress,
detection, image downscaling — happens in the browser's Web Worker on your own
CPU. Install the app as a PWA and it keeps working offline.
