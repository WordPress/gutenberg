<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 2.18.0 (2025-02-12)

### Bug Fixes

-   Fix CSS rule order in some constructed style sheets. ([#68923](https://github.com/WordPress/gutenberg/pull/68923))

## 2.17.0 (2025-01-29)

## 2.16.0 (2025-01-15)

## 2.15.0 (2025-01-02)

## 2.14.0 (2024-12-11)

## 2.13.0 (2024-11-27)

## 2.12.0 (2024-11-16)

## 2.11.0 (2024-10-30)

## 2.10.0 (2024-10-16)

### Enhancements

-   Improvements to the experimental full-page navigation ([#64067](https://github.com/WordPress/gutenberg/pull/64067)):
    -   Remove the `src` attributes from prefetched script tags.
    -   Use `.textContent` instead of `.innerText` to set `<script>` contents.
    -   Use [`populateServerData()`](https://github.com/WordPress/gutenberg/blob/9671329c386d2b743f14ef314823fbf915366ebd/packages/interactivity/src/store.ts#L269) with state from the server.
    -   Wait for the `load` event of the script element before evaluating it.
    -   Make `renderRegions()` an async function.
    -   Only prefetch **module** scripts, never prefetch regular scripts. That's because regular scripts (without `async` or `defer` attributes) found in the head are blocking and must be executed in order. When prefetching there is no guarantee that the scripts will execute in the order they are prefetched. Module scripts can be executed in any order.

## 2.9.0 (2024-10-03)

## 2.8.0 (2024-09-19)

## 2.7.0 (2024-09-05)

## 2.6.0 (2024-08-21)

## 2.5.0 (2024-08-07)

## 2.4.0 (2024-07-24)

## 2.3.0 (2024-07-10)

## 2.2.0 (2024-06-26)

## 2.1.0 (2024-06-15)

## 2.0.0 (2024-05-31)

### Breaking Changes

-   Variables like `process.env.IS_GUTENBERG_PLUGIN` have been replaced by `globalThis.IS_GUTENBERG_PLUGIN`. Build systems using `process.env` should be updated ([#61486](https://github.com/WordPress/gutenberg/pull/61486)).
-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 1.8.0 (2024-05-16)

## 1.7.0 (2024-05-02)

## 1.6.0 (2024-04-19)

## 1.5.0 (2024-04-03)

## 1.4.0 (2024-03-21)

## 1.3.0 (2024-03-06)

### Bug Fixes

-   Fix navigate() issues related to initial state merges. ([#57134](https://github.com/WordPress/gutenberg/pull/57134))

## 1.2.0 (2024-02-21)

## 1.1.0 (2024-02-09)

### New Features

-   Add the `clientNavigationDisabled` option to the `core/router` config. ([58749](https://github.com/WordPress/gutenberg/pull/58749))

## 1.0.0 (2024-01-24)

### Breaking Changes

-   Initial version. ([57924](https://github.com/WordPress/gutenberg/pull/57924))
