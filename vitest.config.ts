/// <reference types="vitest" />

import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
    test: {
        environment: "jsdom",
        setupFiles: path.resolve(__dirname, "./tests/setup.ts"),
    },
});
