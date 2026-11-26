import { defineConfig } from "vite";

/** GitHub Pages project site: https://jxav22.github.io/polyps/ */
export default defineConfig({
  base: "/polyps/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
