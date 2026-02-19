<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

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
