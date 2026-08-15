/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OTEL_COLLECTOR_URL?: string;
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
