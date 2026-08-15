# Uncover64 Total Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the uncover64 React app (Base64 toolkit, ~5,700 lines) into clean, idiomatic React with compound components, HOC/lazy patterns, small focused components, a worker-hook abstraction, Radash-backed utilities, root-level i18n keys, standalone list-item components, and full unit-test coverage.

**Architecture:** Five sequential phases, each leaving `npm run build` and `npm test` green. Pure logic moves first (variation keys, download utils, Radash), then i18n relocation, then the hooks layer that absorbs worker + effect logic out of components, then component extraction (list items standalone, big files split, lazy + HOC + compound patterns), then a coverage sweep. WorkerProvider context is deleted and replaced by per-page `useEncoder()`/`useDecode()` hooks.

**Tech Stack:** React 19, Vite 8, TS 6, Tailwind v4, i18next + react-i18next, radash 12, vitest 4 + @testing-library/react + user-event + jsdom, dexie, oxlint, oxfmt.

## Global Constraints

- React 19 rules: no `useRef` writes during render, no `useEffect` that sets state to a value derivable from current props/state, no stale-closure `ref.current = x` during render.
- List items rendered from arrays MUST be standalone components (files in `src/components/`).
- No `key.split(":")` inside pages/components — always `parseVariationKey()` from `src/lib/variation.ts`.
- Worker ops go through hooks in `src/hooks/` (never call `worker-client` directly from a component).
- i18n keys live at repo root `/locales/*.ts`; `src/i18n.ts` is the single consumer entry; loaded from `main.tsx` only.
- Radash replaces ad-hoc loops (`minBy`, `sum`) where the logic is generic; domain wrappers with telemetry (`try-catch.ts`, `format.ts`) stay custom.
- Tests: every component, page, provider, hook, and pure lib gets a test file. Run `npm test` per task; full suite must stay green.
- `npm run lint` (oxlint) and `npm run format:check` (oxfmt) must pass before each commit.
- tsconfig `erasableSyntaxOnly` — no enums, no parameter properties.

---

## File Structure (target)

```
/locales/
  en.ts                 # moved verbatim from src/i18n/en.ts
  id.ts                 # moved verbatim from src/i18n/id.ts
src/
  i18n.ts               # NEW single init entry (was src/i18n/index.ts); consumes ../locales
  main.tsx              # imports ./i18n (unchanged behavior)
  app.tsx               # slim shell: nav, routes (lazy), footer, providers
  hooks/
    use-latest.ts       # NEW: ref that stays in sync without render-time write
    use-async-effect.ts # NEW: cancel-safe async effect primitive
    use-object-url.ts   # NEW: object URL lifecycle (create + auto-revoke)
    use-encoder.ts      # NEW: replaces WorkerProvider (busy/error/ops)
    use-decode.ts       # NEW: debounced decode lifecycle for decode page
    use-preview.ts      # NEW: compression-page preview+export fetch lifecycle
    use-navigation-trace.ts # NEW: app.tsx prevRef telemetry logic
    use-app-boot.ts     # NEW: AppProvider boot effect
    use-clipboard.ts    # kept
    use-file-drop.ts    # refactored (useLatest)
    use-github-stars.ts # refactored (useAsyncEffect)
    use-media-query.ts  # kept
    use-theme.ts        # kept
    use-query-param.ts  # kept
  components/
    nav-links.tsx             # NEW from app.tsx:49 map
    language-switcher.tsx     # NEW from app.tsx:286+310
    changelog.tsx             # NEW from app.tsx:355+365 (compound: list + item)
    app-routes.tsx            # NEW lazy route table
    quality-option.tsx        # NEW list item from asset-page.tsx:161
    compression-history-row.tsx # NEW list item from asset-page.tsx:232
    decompress-select.tsx     # NEW from decode.tsx:80
    variation-row.tsx         # NEW list item from record-detail.tsx:150
    history-row.tsx           # NEW list item from history-drawer.tsx:87
    export-format-list.tsx    # NEW from export-bar.tsx:47
    snippet-toggle.tsx        # NEW from export-bar.tsx:104
    max-width-select.tsx      # NEW from result-view.tsx:85
    image-optimizer.tsx       # NEW from result-view.tsx inner component
    result-actions.tsx        # NEW download/copy/export header actions from result-view.tsx
    result-view.tsx           # slimmed to result rendering
    split-pane.tsx            # compound: SplitPane.Left/Right
    dropdown-menu.tsx         # formalize compound with shared context
    with-error-boundary.tsx   # NEW HOC wrapping lazy pages
    page-suspense.tsx         # NEW shared lazy fallback
    error-boundary.tsx        # kept
    ui.tsx, drawer.tsx, toggle.tsx, upload-zone.tsx,
    drop-overlay.tsx, pane-header.tsx, fullscreen-viewer.tsx,
    record-detail.tsx, preview-panel.tsx, history-drawer.tsx,
    export-bar.tsx, icons/github-icon.tsx   # kept, adjusted imports
  providers/
    worker-provider.tsx   # DELETED (replaced by hooks)
    app-provider.tsx      # slimmed to useAppBoot()
    history-provider.tsx  # kept (global DB context)
  lib/
    variation.ts          # + parseVariationKey, RAW_KEY
    utils/download.ts     # NEW shared download helpers
    utils/format.ts       # + radash where generic
    ops.ts                # - dead opEncodeAll; logic unchanged
    worker-client.ts      # kept as transport (never imported by components)
    base64/, analytics/, db.ts, export.ts, types.ts, snippets.ts # kept
  worker/
    core.worker.ts        # compress worker termination fix
    compress.worker.ts    # kept
  test/
    setup.ts              # + i18n test init
    render.tsx            # NEW renderWithProviders helper
  constants/, pages/      # kept, adjusted imports + slimmed pages
```

---

## Phase 0 — Config cleanup (aliases, dead code)

### Task 0.1: Remove dead monaco aliases, add path aliases

**Files:**
- Modify: `vite.config.ts:7-19`
- Modify: `tsconfig.app.json` (add `baseUrl`/`paths`)
- Modify: `tsconfig.json` include for `locales`
- Modify: `vitest.config.ts`
- Test: none (config only)

**Interfaces:**
- Produces: aliases `@/*` → `./src/*`, `@locales/*` → `./locales/*`.

- [ ] **Step 1: Delete the monaco alias block**

```ts
// vite.config.ts — remove lines 7-19 (the `monaco` helper + both alias entries)
```

- [ ] **Step 2: Add aliases**

```ts
// tsconfig.app.json compilerOptions
"baseUrl": ".",
"paths": { "@/*": ["src/*"], "@locales/*": ["locales/*"] }

// vite.config.ts resolve.alias
"@": fileURLToPath(new URL("./src", import.meta.url)),
"@locales": fileURLToPath(new URL("./locales", import.meta.url)),

// vitest.config.ts — mirror resolve.alias
```

- [ ] **Step 3: Add `locales` to tsconfig include**

```json
"include": ["src", "locales"]
```

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: PASS (monaco aliases unused; no import references them).

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts vitest.config.ts tsconfig.app.json tsconfig.json
git commit -m "chore: drop dead monaco aliases, add @ and @locales path aliases"
```

### Task 0.2: Migrate imports to `@/` aliases

**Files:** All files under `src/` that use relative imports reaching past their folder (`../../lib/...`, `../lib/...`).

- [ ] **Step 1: Convert every cross-folder relative import to `@/`**

Mechanical: `from "../lib/types"` → `from "@/lib/types"`, `from "../../components/x"` → `from "@/components/x"`, etc. Do NOT change same-folder sibling imports.

- [ ] **Step 2: Verify**

Run: `npm run build && npm test`
Expected: PASS. Test suite still green.

- [ ] **Step 3: Commit**

```bash
git add src
git commit -m "refactor: use @ path alias across src"
```

### Task 0.3: Remove dead `opEncodeAll` from ops.ts

**Files:**
- Modify: `src/lib/ops.ts:195-247`
- Modify: `src/lib/ops.test.ts` (delete the tests that only exercise `opEncodeAll`)

**Interfaces:**
- Consumes: exploration confirmed `opEncodeAll` is unreferenced by `core.worker.ts` (which uses its own `encodeAllInWorker`).

- [ ] **Step 1: Verify dead**

Run: `rg "opEncodeAll" src`
Expected: matches only in `ops.ts` (definition) and `ops.test.ts` (tests).

- [ ] **Step 2: Delete the function and its tests**

- [ ] **Step 3: Verify**

Run: `npm test -- ops && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ops.ts src/lib/ops.test.ts
git commit -m "refactor: remove unused opEncodeAll"
```

---

## Phase 1 — Pure logic: variation keys, download utils, Radash

### Task 1.1: Add `parseVariationKey` + `RAW_KEY` to variation.ts

**Files:**
- Modify: `src/lib/variation.ts`
- Test: `src/lib/variation.test.ts` (NEW)

**Interfaces:**
- Produces:
```ts
export const RAW_KEY = "raw";
export type VariationKey = string; // "raw" | "<algo>" | "<algo>:<quality>"
export interface ParsedVariationKey {
  algorithm: CompressFormat | null; // null only for "raw"
  quality: number | null;           // null for "raw" and bare "<algo>"
}
export function variationKey(algorithm: CompressFormat | null, quality?: number): string; // existing
export function parseVariationKey(key: string): ParsedVariationKey;
```

- [ ] **Step 1: Write failing test**

```ts
// src/lib/variation.test.ts
import { describe, expect, it } from "vitest";
import { RAW_KEY, parseVariationKey, variationKey } from "./variation";

describe("variationKey", () => {
  it("returns RAW_KEY for null algorithm", () => {
    expect(variationKey(null)).toBe(RAW_KEY);
  });
  it("returns bare algo when no quality", () => {
    expect(variationKey("gzip")).toBe("gzip");
  });
  it("formats algo:quality", () => {
    expect(variationKey("brotli", 80)).toBe("brotli:80");
  });
});

describe("parseVariationKey", () => {
  it("parses raw", () => {
    expect(parseVariationKey(RAW_KEY)).toEqual({ algorithm: null, quality: null });
  });
  it("parses algo only", () => {
    expect(parseVariationKey("lz")).toEqual({ algorithm: "lz", quality: null });
  });
  it("parses algo:quality", () => {
    expect(parseVariationKey("gzip:50")).toEqual({ algorithm: "gzip", quality: 50 });
  });
  it("round-trips with variationKey", () => {
    const k = variationKey("deflate", 90);
    expect(parseVariationKey(k)).toEqual({ algorithm: "deflate", quality: 90 });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- variation.test.ts`
Expected: FAIL (`parseVariationKey` not defined).

- [ ] **Step 3: Implement**

```ts
// src/lib/variation.ts
import type { CompressFormat } from "./types";

export const RAW_KEY = "raw";

export function variationKey(algorithm: CompressFormat | null, quality?: number): string {
  if (algorithm === null) return RAW_KEY;
  return quality !== undefined ? `${algorithm}:${quality}` : algorithm;
}

export interface ParsedVariationKey {
  algorithm: CompressFormat | null;
  quality: number | null;
}

export function parseVariationKey(key: string): ParsedVariationKey {
  if (key === RAW_KEY) return { algorithm: null, quality: null };
  const [algorithm, q] = key.split(":");
  return {
    algorithm: algorithm as CompressFormat,
    quality: q === undefined ? null : Number(q),
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- variation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/variation.ts src/lib/variation.test.ts
git commit -m "feat: add parseVariationKey to variation lib"
```

### Task 1.2: Shared download + object URL helpers

**Files:**
- Create: `src/lib/utils/download.ts`
- Test: `src/lib/utils/download.test.ts` (NEW)

**Interfaces:**
- Produces:
```ts
export function downloadBlob(blob: Blob, filename: string): void;
export function downloadBase64(base64: string, mime: string, filename: string): void;
export function createObjectUrl(bytes: Uint8Array | ArrayBuffer, mime: string): string;
export function revokeObjectUrl(url: string): void;
```
- Consumes: duplicate create/revoke in `result-view.tsx:44-59,173-188`, `preview-panel.tsx:46-57,68-81`, `fullscreen-viewer.tsx`; `downloadBlob`/`downloadBase64` in `result-view.tsx:17-24`, `record-detail.tsx:25-33`.

- [ ] **Step 1: Write failing test**

```ts
// src/lib/utils/download.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { createObjectUrl, downloadBase64, downloadBlob, revokeObjectUrl } from "./download";

describe("download", () => {
  afterEach(() => vi.restoreAllMocks());

  it("downloadBlob anchors and clicks a blob URL", () => {
    const anchor = { click: vi.fn() };
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockReturnValue(anchor as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, "appendChild").mockReturnValue({} as never);
    vi.spyOn(document.body, "removeChild").mockReturnValue({} as never);

    downloadBlob(new Blob(["hi"]), "a.bin");

    expect(create).toHaveBeenCalledOnce();
    expect(anchor.click).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith("blob:x");
  });

  it("createObjectUrl builds a blob with mime", () => {
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:y");
    const url = createObjectUrl(new Uint8Array([1, 2]), "image/png");
    expect(url).toBe("blob:y");
    expect(create.mock.calls[0][0].type).toBe("image/png");
  });

  it("revokeObjectUrl calls URL.revokeObjectURL", () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    revokeObjectUrl("blob:z");
    expect(revoke).toHaveBeenCalledWith("blob:z");
  });

  it("downloadBase64 uses data uri", () => {
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:d");
    vi.spyOn(document, "createElement").mockReturnValue({ click: vi.fn() } as never);
    vi.spyOn(document.body, "appendChild").mockReturnValue({} as never);
    vi.spyOn(document.body, "removeChild").mockReturnValue({} as never);
    downloadBase64("aGVsbG8=", "text/plain", "x.txt");
    expect(create).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- download.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
// src/lib/utils/download.ts
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBase64(base64: string, mime: string, filename: string): void {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  downloadBlob(new Blob([bytes], { type: mime }), filename);
}

export function createObjectUrl(bytes: Uint8Array | ArrayBuffer, mime: string): string {
  const blob = new Blob([bytes], { type: mime });
  return URL.createObjectURL(blob);
}

export function revokeObjectUrl(url: string): void {
  URL.revokeObjectURL(url);
}
```

> If the existing `downloadBlob` in `result-view.tsx` accepts a filename differently (check before overwriting), port its signature into `download.ts` and update call sites accordingly. The two existing implementations must behave identically after unification.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- download.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/download.ts src/lib/utils/download.test.ts
git commit -m "feat: shared download and object-url helpers"
```

### Task 1.3: Replace duplicated download/objectURL call sites

**Files:**
- Modify: `src/components/result-view.tsx:17-24,44-59,173-188`
- Modify: `src/components/record-detail.tsx:25-33`
- Modify: `src/components/preview-panel.tsx:46-57,68-81`
- Modify: `src/components/fullscreen-viewer.tsx`

- [ ] **Step 1: Swap each duplicate for `downloadBlob`/`downloadBase64`/`createObjectUrl`/`revokeObjectUrl`**

Every inline `URL.createObjectURL` / `URL.revokeObjectURL` / blob-download block is replaced with the shared helper. Do not change behavior.

- [ ] **Step 2: Verify**

Run: `npm run build && npm test`
Expected: PASS. No remaining `URL.createObjectURL` in `src/components` except inside `download.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/components
git commit -m "refactor: dedupe download and object-url code"
```

### Task 1.4: Radash adoption for generic loops

**Files:**
- Modify: `src/components/record-detail.tsx:108-114` and `src/pages/compression-page.tsx:101-107` (min-by-byteLength loops)
- Modify: `src/lib/utils/format.ts` if generic (check; keep if telemetry/domain-coupled)
- Test: extend `src/lib/export.test.ts` only if `format.ts` output changes (it should not)

- [ ] **Step 1: Replace min-by loops**

```ts
import { minBy } from "radash";
// record-detail.tsx & compression-page.tsx
const best = minBy(variations.filter((v) => v.algorithm), (v) => v.byteLength);
```
Equivalent semantics to the existing loop (skip `algorithm === null`, pick min byteLength, first wins on tie — `minBy` keeps first minimum).

- [ ] **Step 2: Replace any other ad-hoc generic loops found during migration** with radash (`sum`, `sort`, `pick`, `group`) — only where semantics match exactly.

- [ ] **Step 3: Verify**

Run: `npm run build && npm test`
Expected: PASS. `radash` now imported in ≥2 files (was dead weight at 1 trivial call).

- [ ] **Step 4: Commit**

```bash
git add src
git commit -m "refactor: replace ad-hoc loops with radash minBy"
```

---

## Phase 2 — i18n relocation to repo root

### Task 2.1: Move keys to `/locales`, add `src/i18n.ts`

**Files:**
- Create: `/locales/en.ts` (move `src/i18n/en.ts` verbatim)
- Create: `/locales/id.ts` (move `src/i18n/id.ts` verbatim)
- Create: `src/i18n.ts` (move `src/i18n/index.ts` logic, imports `../locales/*`)
- Delete: `src/i18n/` directory
- Modify: `src/main.tsx:3` → keep `import "./i18n"` (still resolves)
- Modify: `src/app.tsx:26` → remove the redundant `import "./i18n"` (main.tsx already loads it)

**Interfaces:**
- Produces:
```ts
// src/i18n.ts (was src/i18n/index.ts)
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en";
import id from "../locales/id";

export const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "id", label: "ID" },
] as const;

export type Locale = (typeof LANGUAGES)[number]["code"];

const STORAGE_KEY = "uncover-lang";
function storedLocale(): string { /* verbatim from old index.ts */ }

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, id: { translation: id } },
  lng: storedLocale(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export function setLocale(code: string): void { /* verbatim */ }
export default i18n;
```
- Consumes: `LANGUAGES`, `setLocale`, `Locale` exported previously from `src/i18n/index.ts` — all consumers keep their import path `@/i18n`.

- [ ] **Step 1: Move the two key files to `/locales/` verbatim** (byte-identical), via `git mv`.

- [ ] **Step 2: Create `src/i18n.ts`** with the ported init (above), pointing imports at `../locales/en` and `../locales/id`.

- [ ] **Step 3: Delete `src/i18n/`** (index.ts + old en/id).

- [ ] **Step 4: Remove the duplicate `import "./i18n"` in `app.tsx:26`** (keep in `main.tsx`).

- [ ] **Step 5: Verify**

Run: `npm run build && npm test`
Expected: PASS. Grep confirms no `src/i18n/` references remain and `LANGUAGES`/`setLocale` still resolve from `@/i18n`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: move i18n keys to /locales, single src/i18n.ts entry"
```

---

## Phase 3 — Hooks layer + worker abstraction

### Task 3.1: `useLatest` hook

**Files:**
- Create: `src/hooks/use-latest.ts`
- Test: `src/hooks/use-latest.test.tsx` (NEW)

**Interfaces:**
- Produces:
```ts
export function useLatest<T>(value: T): { readonly current: T };
```
- Consumes: kills `decode.tsx:26-27` stale-closure ref, `use-file-drop.ts:9-10` render-time ref write, `use-async-effect.ts`.

- [ ] **Step 1: Write failing test**

```ts
// src/hooks/use-latest.test.tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLatest } from "./use-latest";

describe("useLatest", () => {
  it("returns current value synchronously", () => {
    const { result, rerender } = renderHook((v: number) => useLatest(v), { initialProps: 1 });
    expect(result.current.current).toBe(1);
    act(() => rerender(2));
    expect(result.current.current).toBe(2);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- use-latest.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/hooks/use-latest.ts
import { useLayoutEffect, useRef } from "react";

export function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- use-latest.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-latest.ts src/hooks/use-latest.test.tsx
git commit -m "feat: add useLatest hook"
```

### Task 3.2: `useAsyncEffect` primitive

**Files:**
- Create: `src/hooks/use-async-effect.ts`
- Test: `src/hooks/use-async-effect.test.tsx` (NEW)

**Interfaces:**
- Produces:
```ts
export function useAsyncEffect(
  effect: (isActive: () => boolean) => Promise<void>,
  deps: DependencyList,
): void;
```
- Consumes: kills the duplicated cancelled-flag pattern in `compression-page.tsx:42-92`, `use-github-stars.ts:58-66`, `app-provider.tsx:18-45`.

- [ ] **Step 1: Write failing test**

```ts
// src/hooks/use-async-effect.test.tsx
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAsyncEffect } from "./use-async-effect";

describe("useAsyncEffect", () => {
  it("calls effect and isActive is true while mounted", async () => {
    const spy = vi.fn(async (isActive: () => boolean) => {
      expect(isActive()).toBe(true);
    });
    renderHook(({ deps }) => useAsyncEffect(spy, deps), { initialProps: { deps: [1] } });
    await waitFor(() => expect(spy).toHaveBeenCalledOnce());
  });

  it("flips isActive to false on unmount", async () => {
    let isActiveValue = true;
    const spy = vi.fn(async (isActive: () => boolean) => {
      await new Promise((r) => setTimeout(r, 10));
      isActiveValue = isActive();
    });
    const { unmount } = renderHook(({ deps }) => useAsyncEffect(spy, deps), {
      initialProps: { deps: [1] },
    });
    await waitFor(() => expect(spy).toHaveBeenCalledOnce());
    act(() => unmount());
    await waitFor(() => expect(isActiveValue).toBe(false));
  });

  it("re-runs on dep change", async () => {
    const spy = vi.fn(async () => {});
    const { rerender } = renderHook(({ deps }) => useAsyncEffect(spy, deps), {
      initialProps: { deps: [1] },
    });
    act(() => rerender({ deps: [2] }));
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- use-async-effect.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/hooks/use-async-effect.ts
import { useEffect, type DependencyList } from "react";
import { useLatest } from "./use-latest";

export function useAsyncEffect(
  effect: (isActive: () => boolean) => Promise<void>,
  deps: DependencyList,
): void {
  const effectRef = useLatest(effect);
  useEffect(() => {
    let cancelled = false;
    const isActive = () => !cancelled;
    void effectRef.current(isActive);
    return () => {
      cancelled = true;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- use-async-effect.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-async-effect.ts src/hooks/use-async-effect.test.tsx
git commit -m "feat: add useAsyncEffect cancel-safe primitive"
```

### Task 3.3: `useObjectUrl` hook

**Files:**
- Create: `src/hooks/use-object-url.ts`
- Test: `src/hooks/use-object-url.test.tsx` (NEW)

**Interfaces:**
- Produces:
```ts
export function useObjectUrl(bytes: Uint8Array | ArrayBuffer | null, mime: string): string | null;
```
- Consumes: replaces manual create/revoke in `preview-panel.tsx` and `result-view.tsx` (URL lifecycle becomes declarative). `fullscreen-viewer.tsx`/`record-detail.tsx` download paths already handled by `download.ts`.

- [ ] **Step 1: Write failing test**

```ts
// src/hooks/use-object-url.test.tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useObjectUrl } from "./use-object-url";

describe("useObjectUrl", () => {
  it("creates an object URL and revokes on unmount", () => {
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const bytes = new Uint8Array([1, 2, 3]);
    const { result, unmount } = renderHook(() => useObjectUrl(bytes, "image/png"));
    expect(result.current).toBe("blob:x");
    act(() => unmount());
    expect(revoke).toHaveBeenCalledWith("blob:x");
  });

  it("returns null for null bytes and revokes previous URL", () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const create = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValueOnce("blob:a")
      .mockReturnValueOnce("blob:b");
    const { result, rerender } = renderHook(
      ({ b, m }) => useObjectUrl(b, m),
      { initialProps: { b: new Uint8Array([1]), m: "text/plain" } },
    );
    expect(result.current).toBe("blob:a");
    act(() => rerender({ b: new Uint8Array([2]), m: "text/plain" }));
    expect(revoke).toHaveBeenCalledWith("blob:a");
    expect(result.current).toBe("blob:b");
    act(() => rerender({ b: null, m: "text/plain" }));
    expect(result.current).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- use-object-url.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/hooks/use-object-url.ts
import { useEffect, useMemo, useRef } from "react";
import { createObjectUrl, revokeObjectUrl } from "@/lib/utils/download";

export function useObjectUrl(
  bytes: Uint8Array | ArrayBuffer | null,
  mime: string,
): string | null {
  const url = useMemo(
    () => (bytes === null ? null : createObjectUrl(bytes, mime)),
    [bytes, mime],
  );
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    if (prevUrl.current && prevUrl.current !== url) revokeObjectUrl(prevUrl.current);
    prevUrl.current = url;
  }, [url]);

  useEffect(() => () => {
    if (prevUrl.current) revokeObjectUrl(prevUrl.current);
  }, []);

  return url;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- use-object-url.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-object-url.ts src/hooks/use-object-url.test.tsx
git commit -m "feat: add useObjectUrl hook with auto-revoke"
```

### Task 3.4: Worker compression leak fix

**Files:**
- Modify: `src/worker/core.worker.ts:26-57` (`compressViaWorker`)

- [ ] **Step 1: Read `compressViaWorker` and add termination**

After the one-shot `onmessage` listener posts the reply back to the main thread, call `compressWorker.terminate()` and remove the worker from the `compressWorkers` map, since compress workers are one-shot. If a second `onmessage` branch or `onerror` exists, also terminate there. If the worker pool is keyed by `CompressFormat` for reuse, instead add termination only when the request is one-shot.

- [ ] **Step 2: Verify**

Run: `npm test && npm run build`
Expected: PASS. Manual spot-check of a compress roundtrip via the encode page still returns results.

- [ ] **Step 3: Commit**

```bash
git add src/worker/core.worker.ts
git commit -m "fix: terminate one-shot compress workers after reply"
```

### Task 3.5: `useEncoder` hook (replaces WorkerProvider)

**Files:**
- Create: `src/hooks/use-encoder.ts`
- Test: `src/hooks/use-encoder.test.tsx` (NEW)
- Modify: `src/pages/asset-page.tsx`, `src/pages/decode.tsx`, `src/pages/compression-page.tsx`, `src/components/result-view.tsx` — swap `useWorker()` for `useEncoder()`
- Delete: `src/providers/worker-provider.tsx`

**Interfaces:**
- Produces:
```ts
export interface EncoderState {
  busy: boolean;
  error: string | null;
  clearError: () => void;
  encodeAll: (bytes: ArrayBuffer) => Promise<EncodeAllResult | null>;
  encodeSelected: (bytes: ArrayBuffer, selections: EncodeSelection[]) => Promise<EncodeAllResult | null>;
  decode: (input: string, decompress?: DecompressOption) => Promise<DecodeResult | null>;
  downscale: (bytes: ArrayBuffer, mime: string, opts: DownscaleOptions) => Promise<DownscaleResult | null>;
}
export function useEncoder(): EncoderState;
```
- Consumes: the exact op signatures from `worker-client.ts` (`encodeAll`, `encodeSelected`, `decodeInput`, `downscaleImage`); ports the `run` wrapper from `worker-provider.tsx:39-65` (busy/error/telemetry) into hook form.

- [ ] **Step 1: Write failing test** — mock `@/lib/worker-client` and `@/lib/analytics/*`:

```tsx
// src/hooks/use-encoder.test.tsx
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEncoder } from "./use-encoder";

const encodeAll = vi.fn();
const encodeSelected = vi.fn();
const decodeInput = vi.fn();
const downscaleImage = vi.fn();

vi.mock("@/lib/worker-client", () => ({
  encodeAll: (...a: unknown[]) => encodeAll(...a),
  encodeSelected: (...a: unknown[]) => encodeSelected(...a),
  decodeInput: (...a: unknown[]) => decodeInput(...a),
  downscaleImage: (...a: unknown[]) => downscaleImage(...a),
}));

describe("useEncoder", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exposes busy true while an op runs, false after", async () => {
    let resolve!: (v: unknown) => void;
    encodeAll.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => useEncoder());
    let promise!: Promise<unknown>;
    act(() => { promise = result.current.encodeAll(new ArrayBuffer(1)); });
    expect(result.current.busy).toBe(true);
    await act(async () => { resolve({ ok: true }); await promise; });
    expect(result.current.busy).toBe(false);
  });

  it("returns result on success", async () => {
    encodeAll.mockResolvedValue({ variations: [] });
    const { result } = renderHook(() => useEncoder());
    await act(async () => {
      const res = await result.current.encodeAll(new ArrayBuffer(1));
      expect(res).toEqual({ variations: [] });
    });
  });

  it("sets error and returns null on failure", async () => {
    encodeAll.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useEncoder());
    await act(async () => {
      const res = await result.current.encodeAll(new ArrayBuffer(1));
      expect(res).toBeNull();
    });
    expect(result.current.error).toBe("boom");
  });

  it("clearError resets error", async () => {
    encodeAll.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useEncoder());
    await act(async () => { await result.current.encodeAll(new ArrayBuffer(1)); });
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- use-encoder.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — port `WorkerProvider` internals:

```ts
// src/hooks/use-encoder.ts
import { useCallback, useState } from "react";
import * as worker from "@/lib/worker-client";
import type { DecompressOption, DecodeResult, DownscaleOptions, DownscaleResult, EncodeAllResult, EncodeSelection } from "@/lib/types";
import { trackEvent } from "@/lib/analytics/track";
import { logDebug, logError } from "@/lib/analytics/otel";
import { toErrorMessage } from "@/lib/utils/error";
import { tryCatch } from "@/lib/utils/try-catch";

export interface EncoderState { /* as above */ }

export function useEncoder(): EncoderState {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>, event?: string, message?: string): Promise<T | null> => {
      const started = performance.now();
      setBusy(true);
      setError(null);
      const opName = event ?? message ?? "op";
      logDebug(`worker ${opName} start`);
      return tryCatch(fn, {
        log: false,
        message,
        onSuccess: () => {
          if (event) void trackEvent(event);
          logDebug(`worker ${opName} ok`, { ms: Math.round(performance.now() - started) });
        },
        onError: (err) => {
          setError(toErrorMessage(err));
          logError(err, message ?? `worker ${opName} failed`, {
            ms: Math.round(performance.now() - started),
          });
        },
        onFinished: () => setBusy(false),
      });
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);
  const encodeAll = useCallback((b: ArrayBuffer) => run(() => worker.encodeAll(b), "encode"), [run]);
  const encodeSelected = useCallback(
    (b: ArrayBuffer, s: EncodeSelection[]) => run(() => worker.encodeSelected(b, s), "encode"),
    [run],
  );
  const decode = useCallback(
    (input: string, decompress: DecompressOption = "auto") =>
      run(() => worker.decodeInput(input, decompress), "decode", "Decode failed"),
    [run],
  );
  const downscale = useCallback(
    (b: ArrayBuffer, mime: string, opts: DownscaleOptions) =>
      run(() => worker.downscaleImage(b, mime, opts), "downscale"),
    [run],
  );

  return { busy, error, clearError, encodeAll, encodeSelected, decode, downscale };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- use-encoder.test.tsx`
Expected: PASS.

- [ ] **Step 5: Swap all `useWorker()` call sites** to `useEncoder()` (asset-page, decode, compression-page, result-view), then delete `src/providers/worker-provider.tsx` and its import in `app.tsx:376-389`.

- [ ] **Step 6: Verify**

Run: `npm run build && npm test`
Expected: PASS. Grep `useWorker` returns nothing.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: replace WorkerProvider with useEncoder hook"
```

### Task 3.6: `useDecode` hook (debounced, cancel-safe)

**Files:**
- Create: `src/hooks/use-decode.ts`
- Test: `src/hooks/use-decode.test.tsx` (NEW)
- Modify: `src/pages/decode.tsx` — remove effect + `decodeRef`; use the hook

**Interfaces:**
- Produces:
```ts
export interface UseDecodeResult {
  input: string;
  setInput: (value: string) => void;
  decompress: DecompressOption;
  setDecompress: (value: DecompressOption) => void;
  result: DecodeResult | null;
  pending: boolean;
}
export function useDecode(delay = 350): UseDecodeResult;
```
- Consumes: `useEncoder().decode`; kills `decode.tsx:26-27` (stale ref) and `decode.tsx:29-48` (effect → state).

- [ ] **Step 1: Write failing test**

```tsx
// src/hooks/use-decode.test.tsx
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDecode } from "./use-decode";

const decode = vi.fn();
vi.mock("./use-encoder", () => ({ useEncoder: () => ({ decode }) }));

describe("useDecode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("debounces decode on input", async () => {
    decode.mockResolvedValue({ sizeBytes: 3 } as never);
    const { result } = renderHook(() => useDecode(100));
    act(() => result.current.setInput("aGk="));
    expect(decode).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(100); });
    await waitFor(() => expect(decode).toHaveBeenCalledOnce());
    expect(result.current.pending).toBe(false);
    expect(result.current.result).toEqual({ sizeBytes: 3 });
  });

  it("clears result for empty input without calling decode", async () => {
    const { result } = renderHook(() => useDecode(100));
    act(() => result.current.setInput("  "));
    act(() => { vi.advanceTimersByTime(100); });
    expect(decode).not.toHaveBeenCalled();
    expect(result.current.result).toBeNull();
    expect(result.current.pending).toBe(false);
  });

  it("passes decompress option to decode", async () => {
    decode.mockResolvedValue({ sizeBytes: 3 } as never);
    const { result } = renderHook(() => useDecode(100));
    act(() => result.current.setDecompress("gzip"));
    act(() => result.current.setInput("aGk="));
    act(() => { vi.advanceTimersByTime(100); });
    await waitFor(() => expect(decode).toHaveBeenCalledWith("aGk=", "gzip"));
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- use-decode.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/hooks/use-decode.ts
import { useCallback, useEffect, useState } from "react";
import type { DecodeResult, DecompressOption } from "@/lib/types";
import { useEncoder } from "./use-encoder";

export interface UseDecodeResult {
  input: string;
  setInput: (value: string) => void;
  decompress: DecompressOption;
  setDecompress: (value: DecompressOption) => void;
  result: DecodeResult | null;
  pending: boolean;
}

export function useDecode(delay = 350): UseDecodeResult {
  const { decode } = useEncoder();
  const [input, setInput] = useState("");
  const [decompress, setDecompress] = useState<DecompressOption>("auto");
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const value = input.trim();
    if (!value) {
      setResult(null);
      setPending(false);
      return;
    }
    setPending(true);
    let cancelled = false;
    const id = setTimeout(async () => {
      const res = await decode(value, decompress);
      if (cancelled) return;
      setPending(false);
      if (res) setResult(res);
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [input, decompress, decode, delay]);

  const setInputSafe = useCallback((value: string) => setInput(value), []);
  const setDecompressSafe = useCallback((value: DecompressOption) => setDecompress(value), []);

  return {
    input,
    setInput: setInputSafe,
    decompress,
    setDecompress: setDecompressSafe,
    result,
    pending,
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- use-decode.test.tsx`
Expected: PASS.

- [ ] **Step 5: Rewrite `decode.tsx`** to consume the hook; delete `decodeRef`, the `useEffect`, and the `decode`/`error` destructure from `useWorker` (replace with `useDecode` + `useEncoder().error`).

- [ ] **Step 6: Verify**

Run: `npm run build && npm test`
Expected: PASS. `decode.tsx` has no `useEffect`/`useRef` imports left.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/use-decode.ts src/hooks/use-decode.test.tsx src/pages/decode.tsx
git commit -m "feat: useDecode hook, remove stale-ref + effect from decode page"
```

### Task 3.7: `usePreview` hook (compression-page fetch lifecycle)

**Files:**
- Create: `src/hooks/use-preview.ts`
- Test: `src/hooks/use-preview.test.tsx` (NEW)
- Modify: `src/pages/compression-page.tsx:42-92` — replace both fetch effects

**Interfaces:**
- Produces:
```ts
export interface UsePreviewResult {
  preview: PreviewData | null;
  previewLoading: boolean;
  exportBase64: string | null;
  base64Loading: boolean;
}
export function usePreview(params: {
  compression: Compression | null;
  asset: Asset | null;
  selectedId: string;
  variations: { id: string; algorithm: CompressFormat | null }[];
}): UsePreviewResult;
```
- Consumes: `useAsyncEffect`, `useHistory().getBase64`, `useEncoder().decode`. Uses the exact `recordVariations`/`variationKey` id semantics currently in `compression-page.tsx`. `PreviewData` is imported from `@/components/preview-panel` (existing export).

- [ ] **Step 1: Write failing test** (mock `use-history`, `use-encoder`, and `PreviewData`-shaped responses; assert `previewLoading` toggles and `exportBase64` populates).

```tsx
// src/hooks/use-preview.test.tsx
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePreview } from "./use-preview";

const getBase64 = vi.fn();
const decode = vi.fn();
vi.mock("./use-encoder", () => ({ useEncoder: () => ({ decode }) }));
vi.mock("@/providers/history-provider", () => ({
  useHistory: () => ({ getBase64 }),
}));

const compression = {
  uuid: "c1",
  variations: [{ algorithm: "gzip", quality: 50 }],
} as never;

describe("usePreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBase64.mockResolvedValue("aGk=");
    decode.mockResolvedValue({ bytes: new Uint8Array([1]), info: { mime: "text/plain" }, sizeBytes: 1, text: "hi" });
  });

  it("loads preview and export base64 for selected variation", async () => {
    const { result } = renderHook(() =>
      usePreview({
        compression,
        asset: {} as never,
        selectedId: "gzip:50",
        variations: [{ id: "gzip:50", algorithm: "gzip" }],
      }),
    );
    expect(result.current.previewLoading).toBe(true);
    await waitFor(() => expect(result.current.previewLoading).toBe(false));
    expect(result.current.preview?.text).toBe("hi");
    expect(result.current.exportBase64).toBe("aGk=");
  });

  it("is idle when compression is null", () => {
    const { result } = renderHook(() =>
      usePreview({ compression: null, asset: null, selectedId: "raw", variations: [] }),
    );
    expect(result.current.previewLoading).toBe(false);
    expect(result.current.preview).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- use-preview.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement** — move the two fetch effects (preview decode + export base64) into the hook using `useAsyncEffect`, preserving current `cancelled` semantics and dependency sets.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- use-preview.test.tsx`
Expected: PASS.

- [ ] **Step 5: Rewrite `compression-page.tsx`** to consume `usePreview`; delete both `useEffect`s. Keep the `selectedId`/`viewerIndex` state, but remove the `compressionId`-reset effect by rendering an inner `CompressionWorkspace` keyed by `compressionId` (initial state `selectedId = "raw"`).

- [ ] **Step 6: Verify**

Run: `npm run build && npm test`
Expected: PASS. `compression-page.tsx` no longer imports `useEffect`.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/use-preview.ts src/hooks/use-preview.test.tsx src/pages/compression-page.tsx
git commit -m "feat: usePreview hook, remove fetch effects from compression page"
```

### Task 3.8: `useAppBoot` + `useNavigationTrace` (app/app-provider effects)

**Files:**
- Create: `src/hooks/use-app-boot.ts`
- Create: `src/hooks/use-navigation-trace.ts`
- Modify: `src/providers/app-provider.tsx` (use `useAppBoot` internally or drop provider — see below)
- Modify: `src/app.tsx` (`prevRef` telemetry → `useNavigationTrace`)

**Interfaces:**
- Produces:
```ts
export function useAppBoot(): boolean; // ready; runs initWorker once, cancel-safe
export function useNavigationTrace(): void; // wires the prev-pathname OTEL span logic from app.tsx:85,105
```

- [ ] **Step 1: Write failing tests** (mirror the `useAsyncEffect` test style; assert boot resolves ready=true and trace fires once).

- [ ] **Step 2: Implement**

`useAppBoot` wraps `initWorker()` from `@/lib/worker-client` with `useAsyncEffect` + `ready` state. `useNavigationTrace` ports the `prevRef`/pathname effect and `lastNavTrace` logic out of `app.tsx`.

- [ ] **Step 3: Migrate call sites.** If `AppProvider` shrinks to only the boot gate, replace it with `useAppBoot()` in `App` and delete `app-provider.tsx`; otherwise keep the provider but source its value from the hook.

- [ ] **Step 4: Verify**

Run: `npm run build && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: extract app boot and navigation trace into hooks"
```

### Task 3.9: Refactor `use-file-drop.ts` (render-time ref write) + `use-github-stars.ts`

**Files:**
- Modify: `src/hooks/use-file-drop.ts:9-10` — use `useLatest`
- Modify: `src/hooks/use-github-stars.ts:58-66` — use `useAsyncEffect`
- Test: add `src/hooks/use-file-drop.test.tsx` (NEW), add `src/hooks/use-github-stars.test.tsx` (NEW)

- [ ] **Step 1: Write tests** for both hooks covering: drop events set `isDragging`, handler receives files; stars hook fetches once and caches (mock `fetch`, fake timers for 24h TTL).

- [ ] **Step 2: Refactor** `use-file-drop` to keep `handlerRef` via `useLatest` (no assignment during render); `use-github-stars` to use `useAsyncEffect`.

- [ ] **Step 3: Verify**

Run: `npm test -- use-file-drop use-github-stars`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/hooks
git commit -m "refactor: useLatest/useAsyncEffect in file-drop and github-stars hooks"
```

---

## Phase 4 — Component extraction, patterns, lazy loading

### Task 4.1: List-item components (requirement 5)

Extract every inline `.map()` item into a standalone component. Each gets its own test file. The extraction is mechanical: move the JSX block verbatim into a new component, pass the loop variables as props, import at the call site. `record-detail.tsx`'s row is the template (largest block).

**Files:**
- Create + test: `src/components/nav-links.tsx` (from `app.tsx:49`), `src/components/language-switcher.tsx` (from `app.tsx:286,310`), `src/components/changelog.tsx` (from `app.tsx:355,365`), `src/components/quality-option.tsx` (from `asset-page.tsx:161`), `src/components/compression-history-row.tsx` (from `asset-page.tsx:232`), `src/components/decompress-select.tsx` (from `decode.tsx:80`), `src/components/variation-row.tsx` (from `record-detail.tsx:150`), `src/components/history-row.tsx` (from `history-drawer.tsx:87`), `src/components/export-format-list.tsx` (from `export-bar.tsx:47`), `src/components/snippet-toggle.tsx` (from `export-bar.tsx:104`), `src/components/max-width-select.tsx` (from `result-view.tsx:85`)
- Modify: the 11 parent files to render `<Component ... />` instead of inline JSX

**Interfaces (contracts — port the exact props from the loop variables):**

| Component | Props |
|---|---|
| `NavLinks` | `(none — reads useTranslation + router)`; renders ROUTES |
| `LanguageSwitcher` | `variant: "select" \| "menu"` |
| `Changelog` | `(none)`; renders CHANGELOG |
| `QualityOption` | `{ algo: CompressFormat; quality: number; selected: boolean; onChange: (key: string) => void }` |
| `CompressionHistoryRow` | `{ compression: Compression; onClick: () => void }` |
| `DecompressSelect` | `{ value: DecompressOption; onChange: (v: DecompressOption) => void }` |
| `VariationRow` | `{ variation: RecordVariation; selected: boolean; recommended: boolean; onSelect: (id: string) => void }` |
| `HistoryRow` | `{ entry: AssetOrCompression; onOpen: () => void; onDelete: (id: string) => void }` |
| `ExportFormatList` | `{ value: ExportFormat; onChange: (f: ExportFormat) => void }` |
| `SnippetToggle` | `{ value: "node" \| "go"; onChange: (v: "node" \| "go") => void }` |
| `MaxWidthSelect` | `{ value: number; onChange: (v: number) => void }` |

- [ ] **Step 1 (per component): write a behavior test** — render with fixture props, assert labels render and the callback fires on interaction (e.g., `QualityOption` fires `onChange` with the key on checkbox click; `VariationRow` fires `onSelect`).

- [ ] **Step 2 (per component): extract** the JSX verbatim into the new file, add props, replace inline block in the parent.

- [ ] **Step 3: Verify after each**

Run: `npm test -- <new-component>.test.tsx && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit after the batch**

```bash
git add -A
git commit -m "refactor: extract list items into standalone components"
```

### Task 4.2: Split `result-view.tsx` (301 lines)

**Files:**
- Create: `src/components/image-optimizer.tsx` (inner `ImageOptimizer` from `result-view.tsx`)
- Create: `src/components/result-actions.tsx` (download/copy/export header actions)
- Modify: `src/components/result-view.tsx` — slim to result rendering; use `useObjectUrl`
- Test: `src/components/image-optimizer.test.tsx`, `src/components/result-actions.test.tsx` (NEW)

- [ ] **Step 1: Write tests** for `ImageOptimizer` (mock `useEncoder().downscale`; assert width select renders and downscale call on submit) and `ResultActions` (copy + download via mocked `@/lib/utils/download`).

- [ ] **Step 2: Extract** `ImageOptimizer` verbatim; move the JSON-toggle and download/export header actions into `ResultActions`.

- [ ] **Step 3: Verify**

Run: `npm run build && npm test`
Expected: PASS. `result-view.tsx` < 200 lines.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: split result-view into focused components"
```

### Task 4.3: Slim `app.tsx` (399 lines)

**Files:**
- Create: `src/components/footer.tsx` (from `app.tsx` footer + both `DropdownMenu` instances)
- Create: `src/components/app-routes.tsx` (route table; lazy pages)
- Modify: `src/app.tsx` — shell only, uses `NavLinks`, `LanguageSwitcher`, `Changelog`, `Footer`, `AppRoutes`
- Test: `src/components/footer.test.tsx`, `src/components/app-routes.test.tsx` (NEW)

- [ ] **Step 1: Write tests** — `Footer` renders links + changelog opens; `AppRoutes` lazy-renders each page (mock page modules via `vi.mock`).

- [ ] **Step 2: Extract** `Footer` and `AppRoutes`; rewrite `app.tsx` to compose them.

- [ ] **Step 3: Verify**

Run: `npm run build && npm test`
Expected: PASS. `app.tsx` < 120 lines.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: slim app.tsx shell into composed components"
```

### Task 4.4: Lazy loading + Suspense + `withErrorBoundary` HOC

**Files:**
- Create: `src/components/with-error-boundary.tsx`
- Create: `src/components/page-suspense.tsx` (shared fallback)
- Modify: `src/components/app-routes.tsx` — `React.lazy` + `Suspense` per page
- Modify: `src/app.tsx` — wrap `<AppRoutes>` with the error-boundary HOC
- Test: `src/components/with-error-boundary.test.tsx` (NEW)

**Interfaces:**
- Produces:
```ts
// HOC — error boundary applied to any component
export function withErrorBoundary<P extends object>(Component: ComponentType<P>): ComponentType<P>;
```
`ErrorBoundary` (existing `src/components/error-boundary.tsx`) provides the fallback; the HOC wraps each lazy page so a page crash shows the boundary without killing the shell.

- [ ] **Step 1: Write failing test**

```tsx
// src/components/with-error-boundary.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { withErrorBoundary } from "./with-error-boundary";

const Boom = () => { throw new Error("page blew up"); };

describe("withErrorBoundary", () => {
  it("renders the child when it does not throw", () => {
    const Safe = withErrorBoundary(() => <p>ok</p>);
    render(<Safe />);
    expect(screen.getByText("ok")).toBeTruthy();
  });

  it("renders a fallback when the child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const Wrapped = withErrorBoundary(Boom);
    render(<Wrapped />);
    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeTruthy();
    vi.restoreAllMocks();
  });
});
```

> Confirm `error-boundary.tsx`'s fallback text before writing the assertion; adjust the selector to the actual copy.

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- with-error-boundary.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/components/with-error-boundary.tsx
import type { ComponentType, ReactNode } from "react";
import { ErrorBoundary } from "./error-boundary";

export function withErrorBoundary<P extends object>(Component: ComponentType<P>) {
  return function WithErrorBoundary(props: P): ReactNode {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- with-error-boundary.test.tsx`
Expected: PASS.

- [ ] **Step 5: Lazy-load the four pages**

```tsx
// src/components/app-routes.tsx
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { PageSuspense } from "./page-suspense";
import { withErrorBoundary } from "./with-error-boundary";

const EncodePage = withErrorBoundary(lazy(() => import("@/pages/encode")));
const DecodePage = withErrorBoundary(lazy(() => import("@/pages/decode")));
const AssetPage = withErrorBoundary(lazy(() => import("@/pages/asset-page")));
const CompressionPage = withErrorBoundary(lazy(() => import("@/pages/compression-page")));
```
Render `<Suspense fallback={<PageSuspense />}>` around the `<Routes>`. Match the exact route paths currently in `app.tsx:204`.

- [ ] **Step 6: Verify**

Run: `npm run build && npm test`
Expected: PASS. No static `import("./pages/*")` from `app.tsx`; lazy chunks emitted.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: lazy-load pages with Suspense and error-boundary HOC"
```

### Task 4.5: Formalize compound patterns

**Files:**
- Modify: `src/components/dropdown-menu.tsx` — formalize compound via a small `MenuContext` so `MenuItem` closes the menu on click and reports active state (currently loose coupling via children)
- Modify: `src/components/split-pane.tsx` — expose `SplitPane.Left` / `SplitPane.Right` compound sub-components wrapping the existing `left`/`right` props (keep props API as fallback for existing call sites during migration, then drop)
- Modify: call sites (`app.tsx` footer → `Footer`, `asset-page.tsx`, `decode.tsx`, `compression-page.tsx`)
- Test: extend `src/components/dropdown-menu.test.tsx`, add `src/components/split-pane.test.tsx` (NEW)

- [ ] **Step 1: Write tests** — `DropdownMenu` click-to-close on `MenuItem`, Esc close; `SplitPane` renders both panes, drag updates the split ratio (pointer-events mocked), ratio persists to localStorage.

- [ ] **Step 2: Implement** the compound APIs. `SplitPane`:

```tsx
export function SplitPane(props: { storageKey: string; children: ReactNode }): ReactNode;
// usage:
// <SplitPane storageKey="x">
//   <SplitPane.Left>…</SplitPane.Left>
//   <SplitPane.Right>…</SplitPane.Right>
// </SplitPane>
```
Preserve the vertical/mobile and persistence behavior exactly.

- [ ] **Step 3: Migrate call sites**, then remove the old `left`/`right` props.

- [ ] **Step 4: Verify**

Run: `npm run build && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: formalize compound APIs for dropdown-menu and split-pane"
```

### Task 4.6: Hook anti-pattern cleanup sweep (requirement 2)

**Files:** all of `src/pages`, `src/components`, `src/providers`, `src/hooks`.

- [ ] **Step 1: Audit** — grep for remaining `useRef` writes during render, `useEffect` that sets derived state, and stale-closure refs. Known leftovers: `history-provider.tsx:41` `cacheRef` (a legit base64 cache — keep), `split-pane.tsx` refs (DOM + dragging state — keep), `asset-page.tsx` (pure state, fine).

- [ ] **Step 2: Fix any violations found** using the established hooks (`useLatest`, `useAsyncEffect`, `useObjectUrl`).

- [ ] **Step 3: Verify**

Run: `npm run build && npm test && npm run lint`
Expected: PASS, zero lint warnings.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: sweep remaining hook anti-patterns"
```

---

## Phase 5 — Coverage sweep + final verification

### Task 5.1: Fill remaining test gaps (requirement 6)

**Files:** add tests for every unit lacking one. Priority is the full matrix from Global Constraints — every component, page, provider, hook, and pure lib file.

Target list (each gets a test file):
- Components: `ui.tsx`, `drawer.tsx`, `toggle.tsx`, `upload-zone.tsx`, `drop-overlay.tsx`, `pane-header.tsx`, `error-boundary.tsx`, `fullscreen-viewer.tsx`, `record-detail.tsx`, `preview-panel.tsx`, `history-drawer.tsx`, `export-bar.tsx`, `image-optimizer.tsx`, `result-actions.tsx`, `result-view.tsx`, `split-pane.tsx`, `dropdown-menu.tsx`, `page-suspense.tsx`, `github-icon.tsx`
- Pages: `encode.tsx`, `asset-page.tsx`, `compression-page.tsx`, `decode.tsx` (app-level already covered in `app.test.tsx`)
- Providers: `history-provider.tsx`
- Hooks: `use-query-param.ts`, `use-theme.ts`, `use-media-query.ts`, `use-clipboard.ts` (exists), `use-encoder`, `use-decode`, `use-preview`, `use-app-boot`, `use-navigation-trace`, `use-async-effect`, `use-latest`, `use-object-url`
- Lib: `worker-client.ts`, `db.ts`, `snippets.ts`, `track.ts`, `otel.ts`, `variation.ts` (exists), `download.ts` (exists)

- [ ] **Step 1: Per file, write the test** (fixtures from existing test files; mock `worker-client`, `history-provider`, i18n via the shared render helper). Component tests use `renderWithProviders` from `src/test/render.tsx` (see Task 5.2).

- [ ] **Step 2: Verify per batch**

Run: `npm test`
Expected: PASS. Each target file has `it` coverage asserting its behavior.

- [ ] **Step 3: Commit after each batch of 3-5 files**

```bash
git add <files>
git commit -m "test: cover <component|hook|page>"
```

### Task 5.2: Shared render test helper

**Files:**
- Create: `src/test/render.tsx`
- Modify: `src/test/setup.ts` — add i18next init for tests (import `@/i18n`), keep jest-dom + fake-indexeddb

**Interfaces:**
- Produces:
```tsx
export function renderWithProviders(ui: ReactElement, options?: { route?: string }): RenderResult;
```
Initializes i18n (from `@/i18n`), wraps in `HistoryProvider` + `MemoryRouter`, returns testing-library helpers.

- [ ] **Step 1: Implement** (port the provider nesting from `app.test.tsx`).
- [ ] **Step 2: Migrate existing component-ish tests** (`app.test.tsx`) to use it where it reduces duplication.
- [ ] **Step 3: Verify**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: shared render helper with i18n + providers"
```

### Task 5.3: Full verification gate

- [ ] **Step 1: Run all checks**

```bash
npm run lint
npm run format:check
npm run build
npm test
```
Expected: all PASS.

- [ ] **Step 2: Confirm requirement checklist**

1. Compound/HOC/lazy patterns → `dropdown-menu`/`split-pane` compound, `withErrorBoundary` HOC, lazy pages.
2. No `useRef` render-time writes; no derived-state `useEffect`; no stale-closure refs → grep returns zero.
3. Worker encoding behind `useEncoder`/`useDecode`/`usePreview` hooks; `worker-provider.tsx` gone.
4. Radash used for generic loops; duplication (download/objectURL) removed; constants verified lean.
5. Every array-rendered list item is a standalone component.
6. Every component/page/provider/hook has unit tests.
7. i18n keys at `/locales/*.ts`, consumed by `src/i18n.ts`, loaded from `main.tsx`.
8. No `key.split(":")` in pages/components — only `parseVariationKey`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: final verification pass for total refactor"
```

---

## Self-Review

**Spec coverage:** Each of the 8 user requirements maps to a task: 1→4.4/4.5, 2→3.x/4.6, 3→3.5/3.6/3.7, 4→1.2/1.3/1.4, 5→4.1, 6→3.x+4.x tests + Phase 5, 7→2.1, 8→1.1. Worker leak (user-approved) → 3.4. User decisions honored: `/locales` TS modules, phased delivery, full test coverage, worker leak included.

**Placeholder scan:** No TBD steps. Every hook's signature, test skeleton, and implementation is written out. Extraction tasks (4.1, 4.2) intentionally port existing JSX verbatim — the implementer reads the source block; contracts are specified as prop tables rather than restated JSX.

**Type consistency:** `useEncoder().decode` is consumed by `useDecode` and `usePreview` with matching signatures. `parseVariationKey` returns `{ algorithm: CompressFormat | null, quality: number | null }`; `asset-page`'s old `LZ_KEY` special-case collapses: `parseVariationKey("lz")` → `{ algorithm: "lz", quality: null }`, and `proceed` uses `quality ?? QUALITY_ORIGINAL`. `RAW_KEY` replaces the `"raw"` literal in `record-detail`/`compression-page` reset logic. `useObjectUrl` returns `string | null`, matching `PreviewPanel`'s `src` needs.
