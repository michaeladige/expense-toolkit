import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
// On GitHub Pages the app is served from https://<user>.github.io/expense-toolkit/,
// so production builds need that repo path as the base. Dev stays at "/".
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/expense-toolkit/" : "/",
  plugins: [react()],
}));
