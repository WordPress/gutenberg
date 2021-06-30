<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 3.1.0 (2021-05-20)

## 3.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 2.0.0 (2021-04-06)

### Breaking Changes

-   Passing a tuple of components with `as` prop to `ActionItem.Slot` component is no longer supported. Please pass a component with `as` prop instead ([#30417](https://github.com/WordPress/gutenberg/pull/30417)).

## 1.1.0 (2021-03-17)

### Deprecations

-   Passing a tuple of components with `as` prop to `ActionItem.Slot` component is deprecated. Please pass a component with `as` prop instead ([#29340](https://github.com/WordPress/gutenberg/pull/29340)).

## 1.0.0 (2021-01-21)

### Breaking Changes

-   `leftSidebar` prop in `InterfaceSkeleton` component was removed ([#26517](https://github.com/WordPress/gutenberg/pull/26517). Use `secondarySidebar` prop instead.

## 0.11.0 (2020-12-17)

### New Feature

-   Added a store definition `store` for the interface namespace to use with `@wordpress/data` API ([#26655](https://github.com/WordPress/gutenberg/pull/26655)).

### Deprecations

-   `leftSidebar` prop in `InterfaceSkeleton` component has been deprecated ([#26517](https://github.com/WordPress/gutenberg/pull/26517). Use `secondarySidebar` prop instead.

## 0.1.0 (2020-04-15)

Initial release.
