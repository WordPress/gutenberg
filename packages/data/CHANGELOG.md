## 4.1.0 (Unreleased)

### New Feature

- `withDispatch`'s `mapDispatchToProps` function takes the `registry` object as the 3rd param ([#11851](https://github.com/WordPress/gutenberg/pull/11851)).
- `withSelect`'s `mapSelectToProps` function takes the `registry` object as the 3rd param ([#11851](https://github.com/WordPress/gutenberg/pull/11851)).

## 4.0.1 (2018-11-20)

## 4.0.0 (2018-11-15)

### Breaking Changes

- `registry.registerReducer` has been removed. Use `registry.registerStore` instead.
- `registry.registerSelectors` has been removed. Use `registry.registerStore` instead.
- `registry.registerActions` has been removed. Use `registry.registerStore` instead.
- `registry.registerResolvers` has been removed. Use `registry.registerStore` instead.

### Bug Fix

- Resolve an issue where `withSelect`'s `mapSelectToProps` would not be rerun if the wrapped component had incurred a store change during its mount lifecycle.

## 3.1.2 (2018-11-09)

## 3.1.1 (2018-11-09)

## 3.1.0 (2018-11-03)

### New Features

- `registry.registerGenericStore` has been added to support integration with existing data systems.

### Deprecations

- `registry.registerReducer` has been deprecated. Use `registry.registerStore` instead.
- `registry.registerSelectors` has been deprecated. Use `registry.registerStore` instead.
- `registry.registerActions` has been deprecated. Use `registry.registerStore` instead.
- `registry.registerResolvers` has been deprecated. Use `registry.registerStore` instead.

## 3.0.1 (2018-10-30)

### Internal

- Replace Redux implementation of `combineReducers` with in-place-compatible `turbo-combine-reducers`.

## 3.0.0 (2018-10-29)

### Breaking Changes

- Writing resolvers as async generators has been removed. Use the controls plugin instead.

## 2.1.4 (2018-10-19)

## 2.1.3 (2018-10-18)

## 2.1.0 (2018-09-30)

### New Features

- Adding support for using controls in resolvers using the controls plugin.

### Polish

- Updated `redux` dependency to the latest version.

### Deprecations

- Writing resolvers as async generators has been deprecated. Use the controls plugin instead.

### Bug Fixes

- Fix the promise middleware in Firefox.

## 2.0.0 (2018-09-05)

### Breaking Change

- The `withRehdyration` function is removed. Use the persistence plugin instead.
- The `loadAndPersist` function is removed. Use the persistence plugin instead.
- `restrictPersistence`, `setPersistenceStorage` and `setupPersistence` functions have been removed. Please use the data persistence plugin instead.
- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
