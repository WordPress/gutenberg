<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 4.0.0 (2021-05-20)
### Breaking Changes

-   Removed icons: `camera`, `chartLine`, `closeCircleFilled`, `controlsRepeat`, `expand`, as they all have better existing alternatives, and were unused by the block editor. Instead of `camera`, use `capturePhoto`. Instead of `chartLine`, use `chartBar` or `trendingUp` or `trendingDown`, instead of `closeCircleFilled`, use `close`, instead of `controlsRepeat` which was used for Reusable Blocks, consider `reusableBlock`, and instead of `expand`, use `fullscreen`.

## 3.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 2.10.0 (2021-03-17)

## 2.0.0 (2020-05-14)

### Breaking change

-   `star` icon removed as it is duplicative of `star-filled`. ([#21825](https://github.com/WordPress/gutenberg/pull/21825))

### New Feature

-   Include TypeScript type declarations ([#21781](https://github.com/WordPress/gutenberg/pull/21781))

## 1.3.1 (2020-04-15)

### Bug Fix

-   Hide TypeScript type declarations ([#21613](https://github.com/WordPress/gutenberg/pull/21613))
    after they were found to conflict with DefinitelyTyped provided declarations.

## 1.3.0 (2020-04-15)

-   Include TypeScript type declarations ([#21487](https://github.com/WordPress/gutenberg/pull/21487))

## 1.0.0 (2020-02-04)

Initial release.
