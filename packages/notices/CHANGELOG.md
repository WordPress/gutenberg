<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 4.18.0 (2024-01-24)

## 4.17.0 (2024-01-10)

## 4.16.0 (2023-12-13)

## 4.15.0 (2023-11-29)

## 4.14.0 (2023-11-16)

## 4.13.0 (2023-11-02)

## 4.12.0 (2023-10-18)

## 4.11.0 (2023-10-05)

## 4.10.0 (2023-09-20)

## 4.9.0 (2023-08-31)

## 4.8.0 (2023-08-16)

## 4.7.0 (2023-08-10)

## 4.6.0 (2023-07-20)

## 4.5.0 (2023-07-05)

## 4.4.0 (2023-06-23)

## 4.3.0 (2023-06-07)

### New Feature

-   Add a new action `removeNotices` which allows bulk removal of notices by their IDs. ([#39940](https://github.com/WordPress/gutenberg/pull/39940))
-   Add a new action `removeAllNotices` which removes all notices from a given context. ([#44059](https://github.com/WordPress/gutenberg/pull/44059))

## 4.2.0 (2023-05-24)

## 4.1.0 (2023-05-10)

## 4.0.0 (2023-04-26)

### Breaking Change

-   Publish Typescript build types to npm. ([#49650](https://github.com/WordPress/gutenberg/pull/49650))

## 3.31.0 (2023-04-12)

## 3.30.0 (2023-03-29)

## 3.29.0 (2023-03-15)

## 3.28.0 (2023-03-01)

## 3.27.0 (2023-02-15)

## 3.26.0 (2023-02-01)

## 3.25.0 (2023-01-11)

## 3.24.0 (2023-01-02)

## 3.23.0 (2022-12-14)

## 3.22.0 (2022-11-16)

## 3.21.0 (2022-11-02)

## 3.20.0 (2022-10-19)

## 3.19.0 (2022-10-05)

## 3.18.0 (2022-09-21)

## 3.17.0 (2022-09-13)

## 3.16.0 (2022-08-24)

## 3.15.0 (2022-08-10)

## 3.14.0 (2022-07-27)

## 3.13.0 (2022-07-13)

## 3.12.0 (2022-06-29)

## 3.11.0 (2022-06-15)

## 3.10.0 (2022-06-01)

## 3.9.0 (2022-05-18)

## 3.8.0 (2022-05-04)

## 3.7.0 (2022-04-21)

## 3.6.0 (2022-04-08)

## 3.5.0 (2022-03-23)

## 3.4.0 (2022-03-11)

## 3.3.0 (2022-01-27)

## 3.2.0 (2021-07-21)

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
