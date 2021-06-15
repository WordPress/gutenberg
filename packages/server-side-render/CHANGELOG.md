<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 2.1.0 (2021-05-20)

## 2.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 1.21.0 (2021-03-17)

## 1.17.0 (2020-09-03)

### Feature

-   Add an optional prop `httpMethod`, which can be 'POST' or the default 'GET'. Requires WP 5.5 or later. When 'POST', this sends the attributes in the request body, not in the URL. This can allow a bigger attributes object. [#21068](https://github.com/WordPress/gutenberg/pull/21068)

## 1.7.0 (2020-02-04)

### Bug

-   Fix errant `className` being output on default empty placeholder. [#19555](https://github.com/WordPress/gutenberg/pull/19555)

## 1.2.0 (2019-08-29)

### Feature

-   Add `EmptyResponsePlaceholder`, `ErrorResponsePlaceholder` and `LoadingResponsePlaceholder` render props for parent components to swap out alternate placeholders for the various states (see https://github.com/WordPress/gutenberg/pull/16512).

## 1.0.0 (2019-06-12)

### Initial Release

-   Extracted the package from `@wordpress/components` and `@wordpress/editor`;
