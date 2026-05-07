# CSS Conventions & Tokens

## CSS Layers

```css
@layer wp-ui-utilities, wp-ui-components, wp-ui-compositions, wp-ui-overrides;

@layer wp-ui-components {
  .button { /* ... */ }
  .is-solid { /* ... */ }
  .is-brand { /* ... */ }
}
```

## Variant Classes

Use `is-{value}` CSS Module classes, applied via `clsx`:

```css
.is-solid { --button-bg: var(--wpds-color-bg-interactive-brand-strong); }
.is-outline { --button-bg: transparent; }
```

## State Rule

Custom properties define values. CSS properties are the state machine:

```css
/* ✅ Correct: separate variables for each state */
.button {
  --bg: var(--wpds-color-bg-interactive-brand-strong);
  --bg-hover: var(--wpds-color-bg-interactive-brand-strong-hover);
  background-color: var(--bg);
}
.button:not([data-disabled]):hover {
  background-color: var(--bg-hover);
}

/* ❌ Wrong: reassigning variable in state selector */
.button:hover { --bg: var(--wpds-color-bg-interactive-brand-strong-hover); }
```

## Required Utility CSS

Every interactive component must compose:

```tsx
import resetStyles from '../utils/css/resets.module.css';
import focusStyles from '../utils/css/focus.module.css';
import defenseStyles from '../utils/css/global-css-defense.module.css';

className={ clsx(
  defenseStyles.button,     // wp-admin global CSS defense
  resetStyles[ 'box-sizing' ],  // box-sizing inheritance
  focusStyles[ 'outset-ring--focus-visible' ],  // focus ring
  styles.button,
) }
```

## Accessibility in CSS

- `forced-colors` media query for Windows High Contrast Mode
- `prefers-reduced-motion` guard on all transitions/animations
- `data-disabled` attribute (not `:disabled` or `[aria-disabled]`) for disabled states with Base UI

## CSS Composition for Shared Patterns

```css
.header { composes: header from "../utils/css/overlay-chrome.module.css"; }
```

Dialog, AlertDialog, and Drawer share `overlay-chrome.module.css` for header/content/footer layout.

## Design Tokens

Source: `packages/theme/tokens/*.json` (DTCG format)

Build pipeline: Terrazzo → `packages/theme/src/prebuilt/` → CSS custom properties + TypeScript types + fallback maps

Token types exported from `@wordpress/theme` (type-only): `GapSize`, `PaddingSize`, `BorderRadiusSize`, etc.

Fallbacks are injected automatically by PostCSS (for CSS) and esbuild (for JS) plugins. Brand colors fall back to `--wp-admin-theme-color`:
```
var(--wpds-color-bg-interactive-brand-strong)
→ var(--wpds-color-bg-interactive-brand-strong, var(--wp-admin-theme-color, #3858e9))
```

Stylelint enforces: no unknown `--wpds-*` tokens, no manual fallbacks, no manually setting `--wpds-*` properties.

## ThemeProvider

`ThemeProvider` is a **private API** — only accessible within Gutenberg:

```tsx
import { unlock } from '@wordpress/private-apis';
const ThemeProvider = unlock( themePrivateApis ).ThemeProvider;
```

It accepts `color.primary`, `color.bg`, `cursor.control`, and `density` props. External consumers cannot use it — they customize via token stylesheets or CSS property overrides.

## Shared Utilities (`packages/ui/src/utils/`)

- `types.ts` — `ComponentProps<E>` base type for all components
- `css/focus.module.css` — Focus ring variants (`outset-ring--focus-visible`, etc.)
- `css/resets.module.css` — Box-sizing reset
- `css/global-css-defense.module.css` — Defense against wp-admin global styles (unlayered)
- `css/overlay-chrome.module.css` — Shared header/content/footer layout for Dialog/AlertDialog/Drawer
- `createOverlayModalContext` — Factory for modal context providers
- `createOverlayTitleValidation` — Dev-only validation that overlays have a Title
- `useDeprioritizedInitialFocus` — Focus management for overlays
- `useOverlayScrollStateAttributes` — Scroll position tracking with data attributes
