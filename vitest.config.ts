import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      include: ["src/engine/**/*.ts", "src/lib/**/*.ts"],
      exclude: ["src/lib/db.ts", "src/generated/**"],
    },
    testTimeout: 30000,
  },
});
