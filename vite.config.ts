import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
// On GitHub Pages the app is served from https://<user>.github.io/expense-toolkit/,
// so production builds need that repo path as the base. Dev stays at "/".
export default defineConfig(({ command }) => {
  const base = command === "build" ? "/expense-toolkit/" : "/";

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: "prompt",
        // We register the service worker ourselves via virtual:pwa-register/react
        // in UpdatePrompt.tsx; leaving this at the plugin's default would also
        // inject its own registration script, registering the SW twice.
        injectRegister: false,
        includeAssets: ["favicon.svg", "favicon.png", "apple-touch-icon.png"],
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
