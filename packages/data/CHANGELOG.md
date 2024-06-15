<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 10.1.0 (2024-06-15)

## 10.0.0 (2024-05-31)

### Breaking Changes

-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 9.28.0 (2024-05-16)

## 9.27.0 (2024-05-02)

## 9.26.0 (2024-04-19)

-   Add new `createSelector` function for creating memoized store selectors ([#60370](https://github.com/WordPress/gutenberg/pull/60370)).

## 9.25.0 (2024-04-03)

## 9.24.0 (2024-03-21)

-   Deprecate the `getIsResolved` meta-selector ([#59679](https://github.com/WordPress/gutenberg/pull/59679)).

## 9.23.0 (2024-03-06)

## 9.22.0 (2024-02-21)

## 9.21.0 (2024-02-09)

## 9.20.0 (2024-01-24)

## 9.19.0 (2024-01-10)

## 9.18.0 (2023-12-13)

## 9.17.0 (2023-11-29)

## 9.16.0 (2023-11-16)

## 9.15.0 (2023-11-02)

## 9.14.0 (2023-10-18)

## 9.13.1 (2023-10-12)

### Bug Fix

-   Fix `combineReducers()` types ([#55321](https://github.com/WordPress/gutenberg/pull/55321)).

## 9.13.0 (2023-10-05)

### Enhancements

-   Change implementation of `combineReducers` so that it doesn't use `eval` internally, and can run with a CSP policy that doesn't allow `unsafe-eval` ([#54606](https://github.com/WordPress/gutenberg/pull/54606)).

## 9.12.0 (2023-09-20)

## 9.11.0 (2023-08-31)

## 9.10.0 (2023-08-16)

### Enhancements

-   Warn if the `useSelect` hook returns different values when called with the same state and parameters ([#53666](https://github.com/WordPress/gutenberg/pull/53666)).

## 9.9.0 (2023-08-10)

### Bug Fix

-   Update the type definitions for dispatched actions by accounting for Promisified return values and thunks. Previously, a dispatched action's return type was the same as the return type of the original action creator, which did not account for how dispatch works internally. (Plain actions get wrapped in a Promise, and thunk actions ultimately resolve to the innermost function's return type).
-   Update the type definition for dispatch() to handle string store descriptors correctly.

## 9.8.0 (2023-07-20)

## 9.7.0 (2023-07-05)

## 9.6.0 (2023-06-23)

## 9.5.0 (2023-06-07)

## 9.4.0 (2023-05-24)

## 9.3.0 (2023-05-10)

## 9.2.0 (2023-04-26)

## 9.1.0 (2023-04-12)

## 9.0.0 (2023-03-29)

### Breaking Changes

-   The `registry.register` function will no longer register a store if another instance is registered with the same name.

## 8.6.0 (2023-03-15)

## 8.5.0 (2023-03-01)

## 8.4.0 (2023-02-15)

## 8.3.0 (2023-02-01)

## 8.2.0 (2023-01-11)

## 8.1.0 (2023-01-02)

## 8.0.0 (2022-12-14)

### Breaking Changes

-   Updated dependencies to require React 18 ([45235](https://github.com/WordPress/gutenberg/pull/45235))

### Enhancements

-   The `registry.subscribe` function can now subscribe to updates only from one specific store, with a new optional parameter.

## 7.6.0 (2022-11-16)

## 7.5.0 (2022-11-02)

## 7.4.0 (2022-10-19)

## 7.3.0 (2022-10-05)

## 7.2.0 (2022-09-21)

## 7.1.0 (2022-09-13)

## 7.0.0 (2022-08-24)

### Breaking Changes

– Add TypeScript types to the built package (via "types": "build-types" in the package.json)

### Bug Fix

-   Packages: Replace `is-plain-obj` with `is-plain-object` ([#43511](https://github.com/WordPress/gutenberg/pull/43511)).

## 6.15.0 (2022-08-10)

## 6.14.0 (2022-07-27)

## 6.13.0 (2022-07-13)

### Enhancements

-   Use `useDebugValue` in `useSelect` to better display data in React DevTools ([#42225](https://github.com/WordPress/gutenberg/pull/42225)).

## 6.12.0 (2022-06-29)

## 6.11.0 (2022-06-15)

## 6.10.0 (2022-06-01)

## 6.9.0 (2022-05-18)

## 6.8.0 (2022-05-04)

## 6.7.0 (2022-04-21)

## 6.6.0 (2022-04-08)

## 6.5.0 (2022-03-23)

## 6.4.0 (2022-03-11)

## 6.3.0 (2022-02-23)

### New Features

-   Enabled thunks by default for all stores and removed the `__experimentalUseThunks` flag.
-   Store the resolution errors in store metadata and expose them using `hasResolutionFailed` the `getResolutionError` meta-selectors ([#38669](https://github.com/WordPress/gutenberg/pull/38669)).
-   Expose the resolution status (undefined, resolving, finished, error) via the `getResolutionState` meta-selector ([#38669](https://github.com/WordPress/gutenberg/pull/38669)).

## 6.2.1 (2022-02-10)

### Bug Fix

-   Removed unused `memize` dependency ([#38388](https://github.com/WordPress/gutenberg/pull/38388)).

## 6.2.0 (2022-01-27)

### Bug Fix

-   Corrected expect type of action creators and selectors in Redux store configuration type
-   Move `redux` to regular dependencies and update it to version `^4.1.2`.

### Internal

-   Changed names of store-related types to better reflect their use and role.
-   Changed "storeDefinition" to "storeDescriptor" to better reflect its use and role.

## 6.1.0 (2021-09-09)

### New Features

-   Added a `batch` registry method to batch dispatch calls for performance reasons.
-   Add a new migration for the persistence plugin to migrate edit-widgets preferences to the interface package. As part of this change deprecated migrations for the persistence plugin have been removed ([#33774](https://github.com/WordPress/gutenberg/pull/33774)).
-   Update data controls to accept a data store definition as their first param in addition to a string-based store name value ([#34170](https://github.com/WordPress/gutenberg/pull/34170)).

## 6.0.0 (2021-07-29)

### Breaking Change

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 5.2.0 (2021-07-21)

## 5.1.0 (2021-05-20)

## 5.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

### New Features

-   Added new `startResolutions` and `finishResolutions` actions as batched variants of `startResolution` and `finishResolutions` actions.

### Enhancements

-   Updated `redux` dependency from requiring `^4.0.0` to `^4.1.0` (see changes at https://github.com/reduxjs/redux/releases/tag/v4.1.0).

## 4.27.0 (2021-03-17)

### New Features

-   Added new `resolveSelect` registry method to initiate and wait for selector resolution

## 4.26.0 (2020-12-17)

### New Features

-   Added new `register` function for registering a standard `@wordpress/data` store definition ([#26655](https://github.com/WordPress/gutenberg/pull/26655)).
-   Added new `createReduxStore` factory function that creates a data store definition for the provided Redux store options to use with `register` function ([#26655](https://github.com/WordPress/gutenberg/pull/26655)).
-   Extended `select` and `dispatch` functions to accept a data store definition as their first param in addition to a string-based store name value [#26655](https://github.com/WordPress/gutenberg/pull/26655)).
-   Extended `useDispatch` hook to accept a data store definition as their first param in addition to a string-based store name value [#26655](https://github.com/WordPress/gutenberg/pull/26655)).

### Deprecations

-   `registerGenericStore` has been deprecated. Use `register` instead.
-   `registerStore` has been deprecated. Use `register` instead.

## 4.6.0 (2019-06-12)

### New Feature

-   Expose `useSelect` hook for usage in functional components. ([#15737](https://github.com/WordPress/gutenberg/pull/15737))
-   Expose `useDispatch` hook for usage in functional components. ([#15896](https://github.com/WordPress/gutenberg/pull/15896))

### Enhancements

-   `withSelect` internally uses the new `useSelect` hook. ([#15737](https://github.com/WordPress/gutenberg/pull/15737). **Note:** This _could_ impact performance of code using `withSelect` in edge-cases. To avoid impact, memoize passed in `mapSelectToProps` callbacks or implement `useSelect` directly with dependencies.
-   `withDispatch` internally uses a new `useDispatchWithMap` hook (an internal only api) ([#15896](https://github.com/WordPress/gutenberg/pull/15896))

## 4.5.0 (2019-05-21)

### Bug Fix

-   Restore functionality of action-generators returning a Promise. Clarify intent and behaviour for `dispatch` behaviour. Dispatch actions now always
    return a promise ([#14830](https://github.com/WordPress/gutenberg/pull/14830)

### Enhancements

-   Expose `hasResolver` property on returned selectors indicating whether the selector has a corresponding resolver.

## 4.3.0 (2019-03-06)

### Enhancements

-   The `registerStore` function now accepts an optional `initialState` option value.
-   Introduce new `invalidateResolutionForStore` dispatch action for signalling to invalidate the resolution cache for an entire given store.
-   Introduce new `invalidateResolutionForStoreSelector` dispatch action for signalling to invalidate the resolution cache for a store selector (and all variations of arguments on that selector).

### Bug Fix

-   Resolves issue in the persistence plugin where passing `persist` as an array of reducer keys would wrongly replace state values for the unpersisted reducer keys.
-   Restores a behavior in the persistence plugin where a default state provided as an object will be deeply merged as a base for the persisted value. This allows for a developer to include additional new keys in a persisted value default in future iterations of their store.

## 4.2.0 (2019-01-03)

### Enhancements

-   Optimized performance of selector execution (~511% improvement)

## 4.1.0 (2018-12-12)

### New Feature

-   `withDispatch`'s `mapDispatchToProps` function takes the `registry` object as the 3rd param ([#11851](https://github.com/WordPress/gutenberg/pull/11851)).
-   `withSelect`'s `mapSelectToProps` function takes the `registry` object as the 3rd param ([#11851](https://github.com/WordPress/gutenberg/pull/11851)).

## 4.0.1 (2018-11-20)

## 4.0.0 (2018-11-15)

### Breaking Changes

-   `registry.registerReducer` has been removed. Use `registry.registerStore` instead.
-   `registry.registerSelectors` has been removed. Use `registry.registerStore` instead.
-   `registry.registerActions` has been removed. Use `registry.registerStore` instead.
-   `registry.registerResolvers` has been removed. Use `registry.registerStore` instead.

### Bug Fix

-   Resolve an issue where `withSelect`'s `mapSelectToProps` would not be rerun if the wrapped component had incurred a store change during its mount lifecycle.

## 3.1.2 (2018-11-09)

## 3.1.1 (2018-11-09)

## 3.1.0 (2018-11-03)

### New Features

-   `registry.registerGenericStore` has been added to support integration with existing data systems.

### Deprecations

-   `registry.registerReducer` has been deprecated. Use `registry.registerStore` instead.
-   `registry.registerSelectors` has been deprecated. Use `registry.registerStore` instead.
-   `registry.registerActions` has been deprecated. Use `registry.registerStore` instead.
-   `registry.registerResolvers` has been deprecated. Use `registry.registerStore` instead.

## 3.0.1 (2018-10-30)

### Internal

-   Replace Redux implementation of `combineReducers` with in-place-compatible `turbo-combine-reducers`.

## 3.0.0 (2018-10-29)

### Breaking Changes

-   Writing resolvers as async generators has been removed. Use the controls plugin instead.

## 2.1.4 (2018-10-19)

## 2.1.3 (2018-10-18)

## 2.1.0 (2018-09-30)

### New Features

-   Adding support for using controls in resolvers using the controls plugin.

### Polish

-   Updated `redux` dependency to the latest version.

### Deprecations

-   Writing resolvers as async generators has been deprecated. Use the controls plugin instead.

### Bug Fixes

-   Fix the promise middleware in Firefox.

## 2.0.0 (2018-09-05)

### Breaking Change

-   The `withRehdyration` function is removed. Use the persistence plugin instead.
-   The `loadAndPersist` function is removed. Use the persistence plugin instead.
-   `restrictPersistence`, `setPersistenceStorage` and `setupPersistence` functions have been removed. Please use the data persistence plugin instead.
-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
