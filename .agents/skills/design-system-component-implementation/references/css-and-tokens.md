# CSS Conventions & Design Tokens

## Design Tokens

Tokens are CSS custom properties following: `--wpds-{category}-{target}-{variant}[-{state}]`

| Category | Examples |
|----------|---------|
| `color` | `--wpds-color-bg-interactive-brand-strong`, `--wpds-color-fg-content-neutral` |
| `dimension` | `--wpds-dimension-padding-md`, `--wpds-dimension-gap-sm` |
| `typography` | `--wpds-typography-font-size-md`, `--wpds-typography-font-family-body` |
| `border` | `--wpds-border-radius-sm`, `--wpds-border-width-focus` |
| `elevation` | `--wpds-elevation-shadow-md` |

Full reference: `packages/theme/docs/tokens.md`. Use `get_design_tokens` MCP tool if available.

**Never hardcode values.** Never manually add fallbacks (the build pipeline does it). Never set `--wpds-*` properties directly (Stylelint enforces this).

## Layer Architecture

```css
@layer wp-ui-utilities, wp-ui-components, wp-ui-compositions, wp-ui-overrides;
```

All component styles go inside `@layer wp-ui-components { ... }`.

## Variant Styling: CSS classes, not data attributes

Variants use CSS Module class composition via `clsx`:

```css
/* style.module.css */
@layer wp-ui-components {
  .button { /* base styles */ }
  .is-solid { /* solid variant */ }
  .is-outline { /* outline variant */ }
  .is-brand { /* brand tone */ }
  .is-neutral { /* neutral tone */ }
  .is-compact { /* compact size */ }
}
```

```tsx
className={ clsx( styles.button, styles[ `is-${ variant }` ], styles[ `is-${ tone }` ] ) }
```

## State CSS Rule

Custom properties define values. CSS properties are the state machine. Never reassign a custom property in `:hover`:

```css
/* ✅ Correct */
.button {
  --button-bg: var(--wpds-color-bg-interactive-brand-strong);
  --button-bg-hover: var(--wpds-color-bg-interactive-brand-strong-hover);
  background-color: var(--button-bg);
}
.button:not([data-disabled]):hover {
  background-color: var(--button-bg-hover);
}

/* ❌ Wrong — don't reassign variables in state selectors */
.button:hover {
  --button-bg: var(--wpds-color-bg-interactive-brand-strong-hover);
}
```

## Required Utility Modules

Every interactive component should compose these three CSS utility modules:

- `global-css-defense.module.css` — defends against wp-admin global styles (unlayered)
- `resets.module.css` — `box-sizing: border-box` inheritance
- `focus.module.css` — focus ring variants (e.g., `outset-ring--focus-visible`)

## Accessibility in CSS

- `forced-colors` media query for Windows High Contrast Mode
- `prefers-reduced-motion` guard on all transitions/animations
- Use `data-disabled` (not `:disabled` or `[aria-disabled]`) for disabled states with Base UI
