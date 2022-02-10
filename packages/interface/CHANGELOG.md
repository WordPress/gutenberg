<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 4.2.1 (2022-02-10)

### Bug Fix

-   Removed unused `@wordpress/deprecated` dependency ([#38388](https://github.com/WordPress/gutenberg/pull/38388)).

## 4.2.0 (2022-01-27)

## 4.1.0 (2021-09-09)

### New Feature

-   Add support for editor 'feature' preferences. Adds an `isFeatureActive` selector, a `toggleFeature` action, a `MoreMenuDropdown` component, and a `MoreMenuFeatureToggle` component. ([#33774](https://github.com/WordPress/gutenberg/pull/33774)).

## 4.0.0 (2021-07-29)

### Breaking Change

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 3.2.0 (2021-07-21)

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
