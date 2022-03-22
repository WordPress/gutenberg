<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 2.4.0 (2022-03-11)

## 2.3.0 (2022-01-27)

## 2.2.0 (2021-07-21)

## 2.1.0 (2021-05-20)

## 2.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 1.11.0 (2021-03-17)

## 1.6.0 (2020-04-15)

### New feature

-   Include TypeScript type declarations ([#18942](https://github.com/WordPress/gutenberg/pull/18942))

## 1.5.0 (2020-02-04)

### Bug Fixes

-   Resolves an issue where `flush` would not invoke the callback associated with the given element. The previous implementation would simply remove the element from the queue. The updated behavior adheres to what one would expect from a flush as in to complete the deferred execution immediately. With these changes, all callbacks will always (eventually) be invoked unless the application is abruptly terminated. A future version could introduce support for a `remove` function to replicate the previous behavior of `flush`.

## 1.0.0 (2019-03-06)

Initial release.
