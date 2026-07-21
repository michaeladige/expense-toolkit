import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/** Runs a git command, falling back when there's no repo/history (e.g. a
 *  tarball build) rather than failing the whole build over a version string. */
function git(command: string, fallback: string): string {
  try {
    return execSync(command, { encoding: "utf-8" }).trim() || fallback;
  } catch {
    return fallback;
  }
}

// The number of commits reaching HEAD, on whichever branch is checked out —
// a simple, monotonically increasing build number with no separate tagging
// step to remember. CI must check out full history (`fetch-depth: 0`) or
// this collapses to 1 in a shallow clone.
const commitCount = git("git rev-list --count HEAD", "0");
const commitHash = git("git rev-parse --short HEAD", "unknown");

// https://vitejs.dev/config/
// On GitHub Pages the app is served from https://<user>.github.io/expense-toolkit/,
// so production builds need that repo path as the base. Dev stays at "/".
export default defineConfig(({ command }) => {
  const base = command === "build" ? "/expense-toolkit/" : "/";

  return {
    base,
    define: {
      __APP_BUILD__: JSON.stringify(commitCount),
      __APP_COMMIT__: JSON.stringify(commitHash),
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "prompt",
        // We register the service worker ourselves via virtual:pwa-register/react
        // in UpdatePrompt.tsx; leaving this at the plugin's default would also
        // inject its own registration script, registering the SW twice.
        injectRegister: false,
        includeAssets: ["favicon.svg", "favicon.png", "apple-touch-icon.png"],
        // Workbox's default globPatterns omit woff2; add it so the bundled
        // Comic Book font (Bangers) is precached and the offline PWA can render
        // it. Everything else stays at the default app-shell precache.
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        },
        manifest: {
          name: "Expense Toolkit",
          short_name: "Expenses",
          description:
            "Client-side money management app for tracking expenses across day/week/month with multiple categories and currencies.",
          start_url: base,
          scope: base,
          display: "standalone",
          background_color: "#f4f5f7",
          theme_color: "#4f46e5",
          icons: [
            { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
            {
              src: "pwa-maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
  };
});
