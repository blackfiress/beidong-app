import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
  root: "client",
  plugins: [react()],
  build: { outDir: path.resolve("client", "dist") },
  server: { proxy: { "/api": "http://localhost:3001" } }
});
