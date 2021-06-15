<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 3.1.0 (2021-05-20)

## 3.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 2.13.0 (2021-03-17)

## 2.12.0 (2020-12-17)

### New Feature

-   Added a store definition `store` for the notices namespace to use with `@wordpress/data` API ([#26655](https://github.com/WordPress/gutenberg/pull/26655)).

## 2.0.0 (2020-02-10)

### Breaking Change

-   A notices message is no longer spoken as a result of notice creation, but rather by its display in the interface by its corresponding [`Notice` component](https://github.com/WordPress/gutenberg/tree/HEAD/packages/components/src/notice).

## 1.5.0 (2019-06-12)

### New Features

-   Support a new `snackbar` notice type in the `createNotice` action.

## 1.1.2 (2019-01-03)

## 1.1.1 (2018-12-12)

## 1.1.0 (2018-11-20)

### New Feature

-   New option `speak` enables control as to whether the notice content is announced to screen readers (defaults to `true`)

### Bug Fixes

-   While `createNotice` only explicitly supported content of type `string`, it was not previously enforced. This has been corrected.

## 1.0.5 (2018-11-15)

## 1.0.4 (2018-11-09)

## 1.0.3 (2018-11-09)

## 1.0.2 (2018-11-03)

## 1.0.1 (2018-10-30)

## 1.0.0 (2018-10-29)

-   Initial release.
