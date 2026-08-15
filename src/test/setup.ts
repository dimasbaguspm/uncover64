import "@/i18n";
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

// Node 24 defines an experimental `localStorage` global that is undefined
// without --localstorage-file, shadowing jsdom's storage. Provide an
// in-memory implementation so app code and tests behave like a browser.
if (typeof window !== "undefined" && window.localStorage === undefined) {
  const store = new Map<string, string>();
  const storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(window, "localStorage", {
    value: storage,
    configurable: true,
    writable: true,
  });
}
