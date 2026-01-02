import { defineConfig } from "vitest/config";
import react from "@astrojs/react";

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment for DOM testing
    environment: "jsdom",

    // Enable global test APIs (describe, it, expect)
    globals: true,

    // Setup files for global mocks and configuration
    setupFiles: ["./src/test/setup.ts"],

    // Include patterns for test files
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],

    // Exclude patterns
    exclude: ["node_modules", "dist", ".astro", "e2e"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/",
        "dist/",
        ".astro/",
        "e2e/",
        "*.config.*",
        "src/test/",
        "**/*.d.ts",
      ],
      // Coverage thresholds (uncomment when ready)
      // thresholds: {
      //   lines: 80,
      //   functions: 80,
      //   branches: 80,
      //   statements: 80,
      // },
    },

    // Type checking
    typecheck: {
      enabled: true,
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
