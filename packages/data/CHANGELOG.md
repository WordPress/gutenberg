<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

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
