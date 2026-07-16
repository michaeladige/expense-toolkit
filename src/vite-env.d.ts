/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/react" />

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

/** Injected by vite.config.ts's `define` — the commit count reaching HEAD at
 *  build time, used as a simple incrementing build number. */
declare const __APP_BUILD__: string;
/** Injected by vite.config.ts's `define` — the short commit hash at build time. */
declare const __APP_COMMIT__: string;
