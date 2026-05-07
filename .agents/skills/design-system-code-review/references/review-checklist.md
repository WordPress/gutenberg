# Review Checklist

## Component Architecture

- [ ] Uses correct pattern: **Pattern A** (`useRender` + `mergeProps`) for custom components, **Pattern B** (wrapping Base UI with `_Component` alias) for Base UI wrappers
- [ ] `forwardRef` imported from `@wordpress/element` (not `react`)
- [ ] Named function inside `forwardRef` (not arrow function) for DevTools display
- [ ] Props destructured with sensible defaults
- [ ] `render` prop support: Pattern A via `useRender`, Pattern B via Base UI's built-in support

## Types

- [ ] Props interface extends `ComponentProps<E>` from `../utils/types`
- [ ] Pattern B: wraps `ComponentProps< typeof _BaseComponent >`, not raw HTML types
- [ ] Every prop has JSDoc comment with `@default` annotation
- [ ] Variant props use string literal unions (not enums or booleans for multi-state)
- [ ] `disabled` prop is `boolean` (not inherited from Base UI's conditional type)

## CSS

### Layers & Structure

- [ ] All styles inside `@layer wp-ui-components { ... }` (or appropriate layer)
- [ ] No styles outside a `@layer` declaration (except utility modules that are intentionally unlayered)

### Design Tokens

- [ ] All colors, spacing, typography, borders, shadows use `--wpds-*` tokens
- [ ] No hardcoded pixel values, hex colors, or font stacks
- [ ] No manual fallback values — build pipeline injects them automatically
- [ ] No directly setting `--wpds-*` properties (Stylelint enforces this)
- [ ] Token names are valid — check against `packages/theme/tokens/` source files

### Variants

- [ ] Variants use CSS Module class names: `.is-{value}` (e.g., `.is-solid`, `.is-brand`, `.is-compact`)
- [ ] **Not** using `data-variant`, `data-size`, or similar data attributes for styling
- [ ] Classes composed via `clsx()` in the component: `styles[ \`is-${ variant }\` ]`

### State Management

- [ ] Custom properties define values, CSS properties are the state machine
- [ ] State-specific variables use separate properties: `--bg`, `--bg-hover` (not reassigning `--bg` in `:hover`)
- [ ] Disabled state uses `[data-disabled]` selector (Base UI convention), not `:disabled` or `[aria-disabled]`
- [ ] Hover styles guarded: `.button:not([data-disabled]):hover`

### Utility Modules

- [ ] Interactive components compose all three utility CSS modules:
  - `global-css-defense.module.css` — defends against wp-admin global styles
  - `resets.module.css` — `box-sizing: border-box` inheritance
  - `focus.module.css` — focus ring variants
- [ ] Overlay components (Dialog, AlertDialog, Drawer) compose `overlay-chrome.module.css` for shared layout

### Accessibility in CSS

- [ ] `forced-colors` media query for Windows High Contrast Mode support
- [ ] `prefers-reduced-motion` guard on all transitions/animations
- [ ] Focus styles visible and use the standard focus ring utilities

## Accessibility

- [ ] Semantic HTML elements used where appropriate (not `<div>` with `role="button"`)
- [ ] Interactive elements are keyboard accessible
- [ ] Overlay components have a Title sub-component (enforced by dev-mode validation)
- [ ] Icon-only buttons have `aria-label`
- [ ] Focus management correct for dialogs/popovers (auto-focus, return focus)

## Testing

- [ ] Tests import from `../index` (not internal files)
- [ ] Role-based queries: `getByRole`, `getByLabelText` (not `getByTestId`, `getByClassName`)
- [ ] User interaction via `userEvent.setup()` (not `fireEvent`)
- [ ] Async behavior uses `waitFor` or `findBy*`
- [ ] Ref forwarding tested with `createRef` from `@wordpress/element`
- [ ] Disabled state tested (focusable but not clickable)
- [ ] Key test areas covered:
  - Renders correct element/role
  - Props apply correctly (variants, sizes)
  - Keyboard interaction works
  - Disabled state behavior
  - Ref forwarding

## Stories

- [ ] Imports from `@storybook/react-vite` (not `@storybook/react`)
- [ ] Title format: `'Design System/Components/{Name}'`
- [ ] Uses `StoryObj< typeof Component >` type
- [ ] Variant stories spread `Default.args`
- [ ] Compound components list `subcomponents` in meta
- [ ] Interactive stories use render functions with `useState`

## Exports

- [ ] Component exported from `packages/ui/src/index.ts`
- [ ] Compound components: namespace export (`export * as Dialog from './dialog'`) or Object.assign pattern
- [ ] Private APIs properly gated with `unlock()` / `register()` from `@wordpress/private-apis`
- [ ] Global exports test (`packages/ui/src/test/index.test.ts`) updated if adding new component

## Design Tokens (for token PRs)

- [ ] Source JSON in `packages/theme/tokens/` follows DTCG format
- [ ] Token name follows convention: `--wpds-{category}-{target}-{variant}[-{state}]`
- [ ] Tokens are semantic (describe purpose, not appearance)
- [ ] State variants suffixed: `-hover`, `-active`, `-disabled`
- [ ] TypeScript types exported from `@wordpress/theme` for props that accept token values

## Review Comment Style

When leaving feedback:

- **Be specific**: reference the exact pattern or convention being violated
- **Show the fix**: include a corrected code snippet, not just "this is wrong"
- **Distinguish blocking vs. non-blocking**: prefix with "nit:" or "suggestion:" for non-blocking
- **Link to precedent**: point to an existing component that follows the pattern correctly

Example:
```
Variants should use CSS Module classes, not data attributes.

See Button for the pattern:
\`\`\`tsx
className={ clsx( styles.button, styles[ \`is-${ variant }\` ] ) }
\`\`\`

In CSS:
\`\`\`css
.is-solid { /* ... */ }
.is-outline { /* ... */ }
\`\`\`
```
