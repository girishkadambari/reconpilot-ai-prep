// @ts-ignore
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
// @ts-ignore
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: env.VITE_APP_BASE_PATH || "/",
    server: {
      port: 3001,
    },
    plugins: [
      tanstackStart(),
      react(),
      tailwindcss(),
      tsconfigPaths(),
      cloudflare(),
    ],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  };
});
