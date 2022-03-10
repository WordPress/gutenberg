<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Breaking Changes

-   Changed `dragHandle` footprint from 18x18 to 24x24 to match other icons.  ([#39342](https://github.com/WordPress/gutenberg/pull/39342))

## 7.0.0 (2022-02-23)

### New Features

- Added new icon: `post`, and refreshed the existing `pin` icon. ([#39139](https://github.com/WordPress/gutenberg/pull/39139))

### Breaking Changes

-   Removed icons that were added by mistake: `alignJustifyAlt`, `cogAlt`, `sparkles`, `trashFilled`. ([#38849](https://github.com/WordPress/gutenberg/pull/38849))

## 6.3.0 (2022-02-10)

### New Features

-   Added new block icon: `tip` ([#38424](https://github.com/WordPress/gutenberg/pull/38424)).
-   Added new query title, post terms icons, updated pagination, pagination next/prev, and pagination numbers icons: `tip` ([#38521](https://github.com/WordPress/gutenberg/pull/38521)).

## 6.2.0 (2022-01-27)

## 6.1.0 (2021-11-07)

### New Features

-   Added new block icons: `commentAuthorAvatar`, `commentAuthorName`, `commentContent` and `commentReplyLink` ([#36171](https://github.com/WordPress/gutenberg/pull/36171)).

## 6.0.0 (2021-10-12)

### Breaking Change

-   Removed the `minus` icon, which was only used once in the block editor, in favor of the new `reset` icon which offers a more refined vector.

## 5.0.0 (2021-07-29)

### Breaking Change

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 4.1.0 (2021-07-21)

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
