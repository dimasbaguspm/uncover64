import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const monaco = (p: string) =>
  fileURLToPath(new URL(`./node_modules/monaco-editor/${p}`, import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      // monaco-editor's exports map double-prefixes scoped esm subpaths; alias them directly.
      "monaco-editor/esm/vs/editor/editor.api": monaco("esm/vs/editor/editor.api.js"),
      "monaco-editor/esm/vs/language/json/monaco.contribution": monaco(
        "esm/vs/language/json/monaco.contribution.js",
      ),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["uncover64.svg"],
      manifest: {
        name: "Uncover64",
        short_name: "Uncover64",
        description:
          "Zero-Knowledge Base64 Toolkit: Your data never leaves your machine",
        theme_color: "#131d17",
        background_color: "#131d17",
        display: "standalone",
        icons: [{ src: "uncover64.svg", sizes: "any", type: "image/svg+xml" }],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,svg,wasm,png,ico}"],
        globIgnores: ["**/ts.worker-*.js"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
    }),
  ],
})
