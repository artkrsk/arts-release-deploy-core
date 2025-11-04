import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "node_modules/",
        "dist/",
        "tests/",
        "**/*.d.ts",
        "**/index.ts",
        "**/index.tsx",
        "src/types/**",
        "src/interfaces/**",
        "src/constants/**",
        "src/global.d.ts",
      ],
    },
  },
});
