import { readFileSync } from "node:fs";
export default {
  server: { allowedHosts: [".e2b.app"] },
  plugins: [
    {
      name: "downloadable-egypt-catalog",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "vehicles_egypt.json",
          source: readFileSync(
            new URL("./vehicles_egypt.json", import.meta.url),
          ),
        });
      },
    },
  ],
};
