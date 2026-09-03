<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 2.9.0 (2026-08-26)

### Bug Fixes

-   `getAdminThemeColors`: Fix the primary color of the Fresh scheme ([#81618](https://github.com/WordPress/gutenberg/pull/81618)).
-   `Page`: Truncate long titles with an ellipsis instead of overflowing the page horizontally ([#81954](https://github.com/WordPress/gutenberg/pull/81954)).

### New Features

-   `Page`: Add a `navigation` prop (`{ items, currentHref }`) and a `components.link` override for link-based navigation between sections, rendered in the page header ([#79746](https://github.com/WordPress/gutenberg/pull/79746)).

### Internal

-   Point tsconfig references at split dependencies' build projects. ([#81515](https://github.com/WordPress/gutenberg/pull/81515), [#81518](https://github.com/WordPress/gutenberg/pull/81518))
-   Split tsconfig into a build project and a default dev project so dev files are type checked without publishing their declarations. ([#81514](https://github.com/WordPress/gutenberg/pull/81514))

## 2.8.0 (2026-08-12)

### Bug Fixes

-   `Breadcrumbs`: reset the list item margin that wp-admin's `common.css` applies, which left the trail misaligned with the rest of the page header ([#81134](https://github.com/WordPress/gutenberg/pull/81134)).

### Internal

-   Remove obsolete dependency grouping comments as part of the repository-wide separator-free import migration. ([#81248](https://github.com/WordPress/gutenberg/pull/81248))

## 2.7.0 (2026-07-29)

## 2.6.0 (2026-07-14)

### Enhancements

-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).

## 2.5.0 (2026-07-01)

## 2.4.0 (2026-06-24)

### Internal

-   Migrate off the removed `var(--wpds-dimension-base)` primitive token, adopting `--wpds-dimension-size-*` tokens ([#79254](https://github.com/WordPress/gutenberg/pull/79254)).

## 2.3.1 (2026-06-16)

## 2.3.0 (2026-06-10)

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).

### Internal

-   Add `getAdminThemeColors`, which returns the primary and background colors of the active WordPress admin color scheme (for seeding a `ThemeProvider`) ([#78397](https://github.com/WordPress/gutenberg/pull/78397)).

## 2.2.0 (2026-05-27)

## 2.1.0 (2026-05-14)

### Bug Fixes

-   `Page`: Fix nested landmark in header. [#78001](https://github.com/WordPress/gutenberg/pull/78001)

## 2.0.0 (2026-04-29)

### Enhancements

-   `Page`: Keep the header row at a consistent height regardless of whether actions are present, and stop rendering an empty actions container when no actions are provided [#76683](https://github.com/WordPress/gutenberg/pull/76683).

### Breaking Changes

-   Change default `headingLevel` for the `Page` component's header from `2` to `1`, meaning from `h2` to `h1`. If you need to keep previous behaviour, use `<Page title="Example" headingLevel={ 2 }>` [#77617](https://github.com/WordPress/gutenberg/pull/77617)

### New Features

-   `Page`: Add `visual` prop to render a decorative-only icon or image alongside the header title or breadcrumbs. [#76469](https://github.com/WordPress/gutenberg/pull/76469)

### Breaking Changes

-   Convert styles to CSS modules with logical properties, removing previously exposed class names. [#77088](https://github.com/WordPress/gutenberg/pull/77088).

### Enhancements

-   Admin UI: use UI Text component in header. [#77372](https://github.com/WordPress/gutenberg/pull/77372)

## 1.12.0 (2026-04-15)

### Enhancements

-   Increase page header vertical padding. [#77152](https://github.com/WordPress/gutenberg/pull/77152)

### Internal

-   `Breadcrumbs`: Migrate from `@wordpress/components` to `Link`, `Stack`, and `Text` from `@wordpress/ui`. [#77012](https://github.com/WordPress/gutenberg/pull/77012)

## 1.11.0 (2026-04-01)

### Bug Fixes

-   `Breadcrumbs`: throw a runtime error when non-last items are missing a `to` prop [#76493](https://github.com/WordPress/gutenberg/pull/76493/)
-   Fix Page Header not rendering when only `actions` prop is provided. [#76695](https://github.com/WordPress/gutenberg/pull/76695)

## 1.10.0 (2026-03-18)

-   Update Title and Breadcrumbs font sizes. [#76452](https://github.com/WordPress/gutenberg/pull/76452)

## 1.9.0 (2026-03-04)

### Bug Fixes

-   Fix type mismatch between Page `title` (ReactNode) and NavigableRegion `ariaLabel` (string) by adding an optional `ariaLabel` prop to Page that falls back to `title` when it is a string. [#75899](https://github.com/WordPress/gutenberg/pull/75899/)

## 1.8.0 (2026-02-18)

### Enhancements

-   Apply `text-wrap: pretty` for more balanced text in Page component [#74907](https://github.com/WordPress/gutenberg/pull/74907)

## 1.7.0 (2026-01-29)

## 1.6.0 (2026-01-16)

## 1.4.0 (2025-11-26)

## 1.3.0 (2025-11-12)

## 1.2.0 (2025-10-29)

## 1.1.0 (2025-10-17)
