# Uncover64

Zero-Knowledge Base64 Toolkit: Your data never leaves your machine.

Encode, decode, and diff base64 entirely in the browser — in a Web Worker, no server.

## Pages

- **Encode** — drop a file; get base64 across compression algorithms and quality tiers (gzip, deflate, deflate-raw, brotli, lz-string), saved to IndexedDB.
- **Decode** — live preview as you paste; auto-decompresses gzip/brotli.
- **Diff** — two editors, Monaco side-by-side diff in a fullscreen modal.

## Dev

```bash
npm install
npm run dev        # dev server
npm run test       # vitest
npm run lint       # oxlint
npm run format     # oxfmt
npm run build      # production build (PWA)
```

## Env

Copy `.env.example`. Optional:

- `VITE_FARO_COLLECTOR_URL` — OTLP base URL; the app posts events to `/v1/logs` and Faro traces to `/v1/traces`.
- `VITE_APP_VERSION` — version shown in the header.

## Deploy

CI (on push to `main`) builds and pushes to GHCR:

- `ghcr.io/dimasbaguspm/uncover64:<sha>` (`VITE_APP_VERSION=<sha>`)
- `ghcr.io/dimasbaguspm/uncover64:latest` (`VITE_APP_VERSION=Nightly`)

The image is nginx serving the static SPA. Optionally set the `DEPLOY_WEBHOOK_URL`
secret to trigger a deploy after the push.
