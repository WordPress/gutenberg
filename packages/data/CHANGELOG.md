## 2.1.0 (2018-09-30)

## New Features

- Adding support for using controls in resolvers using the controls plugin.

### Polish

- Updated `redux` dependency to the latest version.

### Deprecations

- Writing resolvers as async generators has been deprecated. Use the controls plugin instead.

## Bug Fixes

- Fix the promise middleware in Firefox.

## 2.0.0 (2018-09-05)

### Breaking Change

- The `withRehdyration` function is removed. Use the persistence plugin instead.
- The `loadAndPersist` function is removed. Use the persistence plugin instead.
- `restrictPersistence`, `setPersistenceStorage` and  `setupPersistence` functions have been removed. Please use the data persistence plugin instead.
- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).  If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
