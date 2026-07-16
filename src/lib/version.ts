/**
 * Build identity derived from git history at build time (see vite.config.ts):
 * the commit count reaching HEAD as a simple incrementing build number, plus
 * the short commit hash so a specific deploy can be pinned down exactly.
 */
export const appBuild = __APP_BUILD__;
export const appCommit = __APP_COMMIT__;
export const appVersion = `build ${appBuild} · ${appCommit}`;
