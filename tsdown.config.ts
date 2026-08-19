import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: ["src/server.ts"],
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: "lib",
    platform: "node",
  },
  {
    entry: ["src/client.ts"],
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: "lib",
    platform: "browser",
  },
]);
