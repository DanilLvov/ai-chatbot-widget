import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
 
export default defineConfig({
  plugins: [react()],
 
  build: {
    outDir: "dist",
    emptyOutDir: true,
 
    rollupOptions: {
      input: {
        // Content script — the chat widget injected into every page
        content: resolve(__dirname, "src/content/main.jsx"),
        // Background service worker — handles API calls
        background: resolve(__dirname, "src/background/service-worker.js"),
        // Popup — using root index.html
        popup: resolve(__dirname, "index.html"),
      },
 
      output: {
        // Chrome extensions need predictable filenames (no hashes)
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: (assetInfo) => {
          // Map App.css → content.css so manifest.json can reference it
          if (assetInfo.name === "App.css") return "content.css";
          return "assets/[name][extname]";
        },
      },
    },
  },
 
  clearScreen: false,
});
 