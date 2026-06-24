<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 0.16.0 (2026-06-24)

### Breaking Changes

-   Rename the `bg` and `fg` design token groups to `background` and `foreground`. All `--wpds-color-bg-*` custom properties are now `--wpds-color-background-*`, and all `--wpds-color-fg-*` custom properties are now `--wpds-color-foreground-*` ([#79098](https://github.com/WordPress/gutenberg/pull/79098)).
-   Remove the `--wpds-dimension-base` design token. It was a primitive (the `4px` base unit) and is no longer exposed publicly ([#79254](https://github.com/WordPress/gutenberg/pull/79254)).
-   Remove `privateApis` from the package exports due to API stabilization described in "New Features" ([#78958](https://github.com/WordPress/gutenberg/pull/78958)).

### New Features

-   Add `ThemeProvider` as a public package export ([#78958](https://github.com/WordPress/gutenberg/pull/78958)).
-   Add `--wpds-color-stroke-surface-caution` and `--wpds-color-stroke-surface-caution-strong` so the `caution` tone has the same stroke-surface coverage as the other status tones ([#79198](https://github.com/WordPress/gutenberg/pull/79198)).
-   Add `--wpds-border-radius-xl` for page and app shell surfaces so nested cards and notices can stay on `--wpds-border-radius-lg` without matching the parent radius ([#78913](https://github.com/WordPress/gutenberg/pull/78913)).
-   Add `cornerRadius` prop to `ThemeProvider` for configuring the border-radius preset (`none`, `subtle`, `moderate`, `pronounced`) via prebuilt design token modes. [#78816](https://github.com/WordPress/gutenberg/pull/78816).
-   Add disabled variants for the `brand` and `error` tones of the interactive `background`, `foreground`, and `stroke` color tokens (e.g. `--wpds-color-stroke-interactive-brand-disabled`, `--wpds-color-background-interactive-brand-strong-disabled`), for parity with the existing `neutral` disabled tokens ([#79124](https://github.com/WordPress/gutenberg/pull/79124)).

### Enhancements

-   `ThemeProvider`: forward the `cornerRadius` preset to the document element when `isRoot` is set, matching `color` and `cursor`. [#79153](https://github.com/WordPress/gutenberg/pull/79153).

### Documentation

-   Rename the `bg` and `fg` design token groups to `background` and `foreground`. All `--wpds-color-bg-*` custom properties are now `--wpds-color-background-*`, and all `--wpds-color-fg-*` custom properties are now `--wpds-color-foreground-*` ([#79098](https://github.com/WordPress/gutenberg/pull/79098)).
-   Rename the `--wpds-color-stroke-focus-brand` design token to `--wpds-color-stroke-focus` ([#79125](https://github.com/WordPress/gutenberg/pull/79125)).
-   Added [Design Tokens Maintainer's Guide](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/tokens/README.md) and trimmed maintainer-facing content from package README ([#79157](https://github.com/WordPress/gutenberg/pull/79157)).

### Enhancements

-   Tweak `--wpds-color-foreground-interactive-brand-active` and `--wpds-color-foreground-interactive-error-active` to differentiate them from the non-`active` counterparts ([#79151](https://github.com/WordPress/gutenberg/pull/79151)).

### Bug Fixes

-   `ThemeProvider`: Strictly enforce the documented seed-color input contract for `color.primary` / `color.background`. Inputs outside sRGB (e.g. `oklch()`), previously accepted incidentally, now throw a clear error ([#79148](https://github.com/WordPress/gutenberg/pull/79148)).

### Internal

-   Add unit tests for `ThemeProvider` and `useThemeProviderStyles` ([#79126](https://github.com/WordPress/gutenberg/pull/79126)).
-   Run the stylelint plugin tests through the stylelint Node API instead of spawning the CLI via `child_process` ([#79199](https://github.com/WordPress/gutenberg/pull/79199)).

### Documentation

-   Document the static-stylesheet + `<ThemeProvider>` delivery model, the `isRoot` prop, and the canonical pattern for using `<ThemeProvider>` across documents (iframes and other portals) ([#78664](https://github.com/WordPress/gutenberg/pull/78664)).

### Code Quality

-   `ThemeProvider`: Apply scoped custom properties via inline `style` (mirrored onto the wrapper's own document element when `isRoot`) instead of a per-instance `<style>` element ([#78678](https://github.com/WordPress/gutenberg/pull/78678)).
-   `ThemeProvider`: Stop serializing `data-wpds-root-provider="false"` on non-root providers by only setting the attribute when `isRoot` is `true` ([#79253](https://github.com/WordPress/gutenberg/pull/79253)).
-   Declare `postcss`, `esbuild`, and `vite` as optional peer dependencies for the bundler plugins, and move `@types/react` from `dependencies` to an optional peer dependency ([#79095](https://github.com/WordPress/gutenberg/pull/79095)).

## 0.15.1 (2026-06-16)

## 0.15.0 (2026-06-10)

### New Features

-   Add `--wpds-dimension-size-*` design tokens for element sizing ([#76545](https://github.com/WordPress/gutenberg/pull/76545)).

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).

### Breaking Changes

-   Revert React back to v18 [#78940](https://github.com/WordPress/gutenberg/pull/78940).
-   Drop the experimental `density` support from `ThemeProvider`. The `density` prop has been removed, along with the related `data-wpds-density` attribute and the per-density overrides on `--wpds-dimension-padding-*` / `--wpds-dimension-gap-*` tokens ([#78741](https://github.com/WordPress/gutenberg/pull/78741)).
-   Rename the `color.bg` prop on `ThemeProvider` to `color.background` ([#79007](https://github.com/WordPress/gutenberg/pull/79007)).

### Enhancements

-   Increase the contrast target of `stroke1` from `2.6` to `2.9` so that, on the default scale, it lands between `gray100` and `gray200`. This regenerates `stroke1` for every ramp and updates the values of `--wpds-color-stroke-surface-{brand,error,info,success,warning,neutral-weak}` and `--wpds-color-bg-track-neutral-weak` ([#77599](https://github.com/WordPress/gutenberg/pull/77599)).

### Internal

-   Add Figma `WIDTH_HEIGHT` scopes to `--wpds-dimension-size-*` design tokens ([#79032](https://github.com/WordPress/gutenberg/pull/79032)).

## 0.14.0 (2026-05-27)

### Breaking Changes

-   The `color.primary` and `color.bg` props on `ThemeProvider` now require an sRGB-parseable string (hex, `rgb(...)`, or CSS named color). Other CSS color formats like `hsl(...)`, `oklch(...)`, and `lab(...)` are no longer supported ([#77653](https://github.com/WordPress/gutenberg/pull/77653)).

### Documentation

-   Add ["Design System/Tokens/Introduction" page](https://wordpress.github.io/gutenberg/?path=/docs/design-system-tokens-introduction--docs) to Storybook ([#78449](https://github.com/WordPress/gutenberg/pull/78449)).
-   Add "How to pick a token" and "Naming pattern" guidance to [the design system tokens reference documentation](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/docs/tokens.md) ([#78438](https://github.com/WordPress/gutenberg/pull/78438)).

### Internal

-   Refactor color space registration to avoid module-level side effects ([#77653](https://github.com/WordPress/gutenberg/pull/77653)).

## 0.13.0 (2026-05-14)

### New Features

-   Add `--wpds-motion-duration-*` and `--wpds-motion-easing-*` design tokens for standardizing animation timing across components. Easing tokens use intent-based names: `subtle`, `balanced`, and `expressive` ([#76097](https://github.com/WordPress/gutenberg/pull/76097)).

## 0.12.0 (2026-04-29)

## 0.11.0 (2026-04-15)

### Breaking changes

-   Renamed typography tokens from `--wpds-font-*` to `--wpds-typography-*`. Sub-groups that correspond to CSS `font-*` properties retain the `font-` prefix; `line-height` does not. To migrate:
    -   `--wpds-font-family-*`: use `--wpds-typography-font-family-*` instead.
    -   `--wpds-font-size-*`: use `--wpds-typography-font-size-*` instead.
    -   `--wpds-font-weight-*`: use `--wpds-typography-font-weight-*` instead.
    -   `--wpds-font-line-height-*`: use `--wpds-typography-line-height-*` instead.

### Enhancements

-   The design token fallback build plugins (PostCSS, esbuild, Vite) now throw an error when encountering an unknown `--wpds-*` token, instead of silently skipping it.

## 0.10.0 (2026-04-01)

### Enhancements

-   Change the default value of `--wpds-cursor-control` from `default` to `pointer` ([#76762](https://github.com/WordPress/gutenberg/pull/76762)).

## 0.9.0 (2026-03-18)

### New Features

-   Add `cursor` prop to `ThemeProvider` for configuring the `--wpds-cursor-control` design token ([#76410](https://github.com/WordPress/gutenberg/pull/76410)).
-   Added `no-token-fallback-values` stylelint rule that disallows manual fallback values for `--wpds-*` design tokens. Available as `@wordpress/theme/stylelint-plugins/no-token-fallback-values` ([#76415](https://github.com/WordPress/gutenberg/pull/76415)).

## 0.8.0 (2026-03-04)

### New Features

-   Added PostCSS, esbuild, and Vite build plugins that inject fallback values for design system tokens (`--wpds-*`). Available as package exports: `@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks`, `@wordpress/theme/esbuild-plugins/esbuild-ds-token-fallbacks`, `@wordpress/theme/vite-plugins/vite-ds-token-fallbacks` ([#75589](https://github.com/WordPress/gutenberg/pull/75589)).
-   Add `--wpds-cursor-control` design token for interactive non-link elements ([#75697](https://github.com/WordPress/gutenberg/pull/75697)).
-   Add `--wpds-dimension-surface-width-*` design tokens for component width constraints.

## 0.7.0 (2026-02-18)

### Breaking changes

-   Renamed padding tokens to remove the `surface` segment and updated the scale from `2xs`–`lg` to `xs`–`3xl` ([#75054](https://github.com/WordPress/gutenberg/pull/75054)). To preserve the same values:
    -   `--wpds-dimension-padding-surface-2xs`: use `--wpds-dimension-padding-xs` instead.
    -   `--wpds-dimension-padding-surface-xs`: use `--wpds-dimension-padding-sm` instead.
    -   `--wpds-dimension-padding-surface-sm`: use `--wpds-dimension-padding-lg` instead.
    -   `--wpds-dimension-padding-surface-md`: use `--wpds-dimension-padding-2xl` instead.
    -   `--wpds-dimension-padding-surface-lg`: use `--wpds-dimension-padding-3xl` instead.
-   Updated gap token scale from `2xs`–`xl` to `xs`–`3xl` ([#75054](https://github.com/WordPress/gutenberg/pull/75054)). To preserve the same values:
    -   `--wpds-dimension-gap-2xs`: use `--wpds-dimension-gap-xs` instead.
    -   `--wpds-dimension-gap-xs`: use `--wpds-dimension-gap-sm` instead.
    -   `--wpds-dimension-gap-sm`: use `--wpds-dimension-gap-md` instead.
    -   `--wpds-dimension-gap-md`: use `--wpds-dimension-gap-lg` instead.
    -   `--wpds-dimension-gap-lg`: use `--wpds-dimension-gap-xl` instead.
    -   `--wpds-dimension-gap-xl`: use `--wpds-dimension-gap-3xl` instead.
-   Renamed elevation tokens to use abbreviated size names for consistency with other tokens ([#75103](https://github.com/WordPress/gutenberg/pull/75103)):
    -   `--wpds-elevation-x-small`: use `--wpds-elevation-xs` instead.
    -   `--wpds-elevation-small`: use `--wpds-elevation-sm` instead.
    -   `--wpds-elevation-medium`: use `--wpds-elevation-md` instead.
    -   `--wpds-elevation-large`: use `--wpds-elevation-lg` instead.

## 0.6.0 (2026-01-29)

### Breaking changes

-   Renamed border tokens to remove the `surface` segment from token names ([#74617](https://github.com/WordPress/gutenberg/pull/74617)):

    -   `--wpds-border-radius-surface-xs`: use `--wpds-border-radius-xs` instead.
    -   `--wpds-border-radius-surface-sm`: use `--wpds-border-radius-sm` instead.
    -   `--wpds-border-radius-surface-md`: use `--wpds-border-radius-md` instead.
    -   `--wpds-border-radius-surface-lg`: use `--wpds-border-radius-lg` instead.
    -   `--wpds-border-width-surface-xs`: use `--wpds-border-width-xs` instead.
    -   `--wpds-border-width-surface-sm`: use `--wpds-border-width-sm` instead.
    -   `--wpds-border-width-surface-md`: use `--wpds-border-width-md` instead.
    -   `--wpds-border-width-surface-lg`: use `--wpds-border-width-lg` instead.
    -   `--wpds-border-width-interactive-focus`: use `--wpds-border-width-focus` instead.

## 0.5.0 (2026-01-16)

### Breaking changes

-   Removed the following tokens ([#74470](https://github.com/WordPress/gutenberg/pull/74470)):
    -   `--wpds-color-bg-interactive-neutral`: use `--wpds-color-bg-interactive-neutral-weak` instead.
    -   `--wpds-color-bg-interactive-neutral-active`: use `--wpds-color-bg-interactive-neutral-weak-active` instead.
    -   `--wpds-color-bg-interactive-neutral-disabled`: use `--wpds-color-bg-interactive-neutral-weak-disabled` instead.
    -   `--wpds-color-bg-interactive-brand`: use `--wpds-color-bg-interactive-brand-weak` instead.
    -   `--wpds-color-bg-interactive-brand-active`: use `--wpds-color-bg-interactive-brand-weak-active` instead.
    -   `--wpds-color-bg-interactive-brand-disabled`: use `--wpds-color-bg-interactive-neutral-weak-disabled` instead.
    -   `--wpds-color-bg-interactive-brand-strong-disabled`: use `--wpds-color-bg-interactive-neutral-strong-disabled` instead.
    -   `--wpds-color-bg-interactive-brand-weak-disabled`: use `--wpds-color-bg-interactive-neutral-weak-disabled` instead.
    -   `--wpds-color-bg-interactive-error-disabled`: use `--wpds-color-bg-interactive-neutral-weak-disabled` instead.
    -   `--wpds-color-bg-interactive-error-strong-disabled`: use `--wpds-color-bg-interactive-neutral-strong-disabled` instead.
    -   `--wpds-color-bg-interactive-error-weak-disabled`: use `--wpds-color-bg-interactive-neutral-weak-disabled` instead.
    -   `--wpds-color-fg-interactive-brand-disabled`: use `--wpds-color-fg-interactive-neutral-disabled` instead.
    -   `--wpds-color-fg-interactive-brand-strong-disabled`: use `--wpds-color-fg-interactive-neutral-strong-disabled` instead.
    -   `--wpds-color-fg-interactive-error-disabled`: use `--wpds-color-fg-interactive-neutral-disabled` instead.
    -   `--wpds-color-fg-interactive-error-strong-disabled`: use `--wpds-color-fg-interactive-neutral-strong-disabled` instead.
    -   `--wpds-color-bg-thumb-brand-disabled`: use the newly added `--wpds-color-bg-thumb-neutral-disabled` instead.

### Enhancements

-   Tweaked the values of the following tokens ([#74470](https://github.com/WordPress/gutenberg/pull/74470)):
    -   `--wpds-color-bg-interactive-neutral-strong-disabled` from `#d2d2d2` to `#e2e2e2`.
    -   `--wpds-color-bg-interactive-neutral-weak-disabled` from `#e2e2e2` to `#00000000`.
    -   `--wpds-color-fg-interactive-neutral-strong-disabled` from `#6d6d6d` to `#8a8a8a`.

### New Features

-   Added stylelint plugins for design token linting: `no-unknown-ds-tokens` to catch references to non-existent design tokens, and `no-setting-wpds-custom-properties` to prevent reassignments of design token variables ([#74226](https://github.com/WordPress/gutenberg/pull/74226)).
-   Expose `ThemeProvider` TypeScript type from package. While the component is still experimental, this makes it easier to use TypeScript typings in your code, which would otherwise be inaccessible. ([#74011](https://github.com/WordPress/gutenberg/pull/74011))
