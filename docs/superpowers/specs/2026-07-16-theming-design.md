# Theming: mode, color, and pattern

## Context

The app's look is fixed: `src/index.css` defines one palette and flips it via a
`@media (prefers-color-scheme: dark)` query. The user can't override the OS, and
there is no colour choice at all. This adds user-controlled theming along three
independent axes — **mode**, **accent colour**, and **background pattern** —
selectable in Settings and persisted like any other setting.

Mobile is the primary platform, which drives two requirements that would
otherwise look like polish: the `theme-color` meta must track the theme (it
tints the browser chrome), and the theme must be applied before first paint (a
PWA cold start otherwise flashes the default theme).

## The three axes

| Axis | Values | Attribute |
|---|---|---|
| Mode | `light`, `dark`, `system` | `data-mode` (always resolved to light/dark) |
| Colour | `indigo`, `violet`, `emerald`, `cyan`, `amber`, `rose` | `data-theme` |
| Pattern | `none`, `dots`, `grid`, `diagonal` | `data-pattern` |

All three are set as `data-*` attributes on `<html>` and combine freely.
`system` is resolved in JS via `matchMedia`, so CSS only ever sees a concrete
`light` or `dark`.

## Architecture

**No component changes.** Every component already consumes `var(--bg)`,
`var(--primary)` etc. from the single block in `src/index.css`, so theming is
purely a question of what those variables resolve to.

**Colour is one variable per theme.** Each colour theme defines only its accent
(a light and a dark shade); the neutral ramp takes a subtle wash of it via
`color-mix()` — a technique already used in `App.module.css`:

```css
:root[data-theme="emerald"] { --accent-light: #059669; --accent-dark: #34d399; }

:root {
  --primary: var(--accent);
  --bg:      color-mix(in srgb, var(--accent) var(--tint-bg), var(--neutral-bg));
  --surface: color-mix(in srgb, var(--accent) var(--tint-surface), var(--neutral-surface));
}
```

Mode supplies `--neutral-*`, the text ramp, the tint strengths, and selects
`--accent-light` vs `--accent-dark`. Adding a seventh colour is therefore one
rule, and every colour works in both modes by construction.

**`color-scheme` is set per mode** (not `light dark`), so native controls follow
the chosen mode rather than the OS — otherwise picking Light on a dark-mode
phone renders dark `<select>`s.

**Patterns are pure CSS gradients** (`radial-gradient` / `repeating-linear-gradient`)
on the body background — no image assets, nothing extra to precache. They ink in
the accent at low alpha, so they adapt to mode and colour for free. Cards stay
solid (`--surface`), so text never sits on a pattern. `background-attachment`
stays at the default `scroll`: `fixed` is a known repaint cost on iOS Safari.

## Persistence and migration

`Settings` gains `mode?`, `themeColor?`, `pattern?` — **optional**, matching the
existing `notificationsEnabled?` / `reportsSince?` pattern. `useLocalStorage`
does not merge defaults into a stored object, so existing users (and JSON
backups written before this feature) have no such keys; every read site falls
back to the defaults in `src/lib/theme.ts`. Backup/restore needs no change: it
already captures `settings` wholesale.

## Mobile specifics

- **`theme-color`**: the two hardcoded, media-query'd `<meta>` tags in
  `index.html` collapse to one tag updated at runtime from the resolved body
  background. The PWA manifest's `theme_color` stays static — it's baked at
  build time and can't follow a runtime choice.
- **No flash of default theme**: a small inline script in `<head>` reads the
  saved settings from `localStorage` and sets the three attributes before first
  paint. It intentionally duplicates the storage key and the defaults; that
  duplication is the price of running before any module loads, and is called out
  in a comment on both sides.

## Files

New: `src/lib/theme.ts` (registry + defaults + `resolveMode`, pure),
`src/hooks/useTheme.ts` (applies attributes, watches `system`, updates the meta),
`src/components/AppearancePanel.tsx` + `.module.css`.

Modified: `src/types.ts`, `src/index.css`, `src/components/SettingsPanel.tsx`,
`src/App.tsx`, `index.html`.

## Deliberately out of scope

**Category colours are untouched.** They are user data with semantic meaning and
are frozen into report snapshots; a theme must never rewrite them.

## Verification

`npm run typecheck`, then drive the app at a 375px viewport: switch each axis and
confirm the palette, pattern and native controls all follow; confirm `system`
tracks an OS change live; reload and confirm no flash of the default theme;
confirm the `theme-color` meta updates; confirm a pre-theming JSON backup still
restores.
