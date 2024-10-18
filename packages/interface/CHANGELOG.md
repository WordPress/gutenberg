<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 7.0.0 (2024-10-16)

### Breaking Changes

-   `InterfaceSkeleton` no longer supports region navigation and its props `enableRegionNavigation` and `shortcuts` are removed. ([#63611](https://github.com/WordPress/gutenberg/pull/63611)). It’s recommended to add region navigation with the higher-order component `navigateRegions` or the hook `__unstableUseNavigateRegions` from `@wordpress/components`.

## 6.9.0 (2024-10-03)

## 6.8.0 (2024-09-19)

## 6.7.0 (2024-09-05)

## 6.6.0 (2024-08-21)

## 6.5.0 (2024-08-07)

## 6.4.0 (2024-07-24)

## 6.3.0 (2024-07-10)

## 6.2.0 (2024-06-26)

## 6.1.0 (2024-06-15)

## 6.0.0 (2024-05-31)

### Breaking Changes

-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 5.35.0 (2024-05-16)

### Internal

-   Replaced `classnames` package with the faster and smaller `clsx` package ([#61138](https://github.com/WordPress/gutenberg/pull/61138)).

## 5.34.0 (2024-05-02)

## 5.33.0 (2024-04-19)

## 5.32.0 (2024-04-03)

## 5.31.0 (2024-03-21)

## 5.30.0 (2024-03-06)

### Breaking Changes

-   Removed `MoreMenuDropdown` component ([#59095](https://github.com/WordPress/gutenberg/pull/59095)).

## 5.29.0 (2024-02-21)

## 5.28.0 (2024-02-09)

## 5.27.0 (2024-01-24)

## 5.26.0 (2024-01-10)

## 5.25.0 (2023-12-13)

## 5.24.0 (2023-11-29)

## 5.23.0 (2023-11-16)

## 5.22.0 (2023-11-02)

## 5.21.0 (2023-10-18)

## 5.20.0 (2023-10-05)

## 5.19.0 (2023-09-20)

## 5.18.0 (2023-08-31)

## 5.17.0 (2023-08-16)

## 5.16.0 (2023-08-10)

## 5.15.0 (2023-07-20)

## 5.14.0 (2023-07-05)

## 5.13.0 (2023-06-23)

## 5.12.0 (2023-06-07)

## 5.11.0 (2023-05-24)

## 5.10.0 (2023-05-10)

## 5.9.0 (2023-04-26)

## 5.8.0 (2023-04-12)

## 5.7.0 (2023-03-29)

## 5.6.0 (2023-03-15)

## 5.5.0 (2023-03-01)

## 5.4.0 (2023-02-15)

## 5.3.0 (2023-02-01)

## 5.2.0 (2023-01-11)

## 5.1.0 (2023-01-02)

## 5.0.0 (2022-12-14)

### Breaking Changes

-   Updated dependencies to require React 18 ([45235](https://github.com/WordPress/gutenberg/pull/45235))

## 4.21.0 (2022-11-16)

## 4.20.0 (2022-11-02)

## 4.19.0 (2022-10-19)

## 4.18.0 (2022-10-05)

## 4.17.0 (2022-09-21)

## 4.16.0 (2022-09-13)

## 4.15.0 (2022-08-24)

## 4.14.0 (2022-08-10)

## 4.13.0 (2022-07-27)

## 4.12.0 (2022-07-13)

## 4.11.0 (2022-06-29)

## 4.10.0 (2022-06-15)

## 4.9.0 (2022-06-01)

## 4.8.0 (2022-05-18)

## 4.7.0 (2022-05-04)

## 4.6.0 (2022-04-21)

## 4.5.0 (2022-04-08)

## 4.4.0 (2022-03-23)

## 4.3.0 (2022-03-11)

## 4.2.1 (2022-02-10)

### Bug Fixes

-   Removed unused `@wordpress/deprecated` dependency ([#38388](https://github.com/WordPress/gutenberg/pull/38388)).

## 4.2.0 (2022-01-27)

## 4.1.0 (2021-09-09)

### New Features

-   Add support for editor 'feature' preferences. Adds an `isFeatureActive` selector, a `toggleFeature` action, a `MoreMenuDropdown` component, and a `MoreMenuFeatureToggle` component. ([#33774](https://github.com/WordPress/gutenberg/pull/33774)).

## 4.0.0 (2021-07-29)

### Breaking Changes

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 3.2.0 (2021-07-21)

## 3.1.0 (2021-05-20)

## 3.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at <https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/>.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at <https://nodejs.org/en/about/releases/>.

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

### New Features

-   Added a store definition `store` for the interface namespace to use with `@wordpress/data` API ([#26655](https://github.com/WordPress/gutenberg/pull/26655)).

### Deprecations

-   `leftSidebar` prop in `InterfaceSkeleton` component has been deprecated ([#26517](https://github.com/WordPress/gutenberg/pull/26517). Use `secondarySidebar` prop instead.

## 0.1.0 (2020-04-15)

Initial release.
