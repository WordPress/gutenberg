## 5.1.1 (2018-10-30)

## 5.1.0 (2018-10-30)

### New feature

- `isValidBlockContent` function has been added ([#10891](https://github.com/WordPress/gutenberg/pull/10891)).

### Deprecation

- `isValidBlock` function has been deprecated ([#10891](https://github.com/WordPress/gutenberg/pull/10891)). Use `isValidBlockContent` instead.

## 5.0.0 (2018-10-29)

### Breaking Changes

- Attribute type coercion has been removed. Omit the source to preserve type via serialized comment demarcation.
- `setUnknownTypeHandlerName` has been removed. Please use `setFreeformContentHandlerName` and `setUnregisteredTypeHandlerName` instead.
- `getUnknownTypeHandlerName` has been removed. Please use `getFreeformContentHandlerName` and `getUnregisteredTypeHandlerName` instead.

### New Feature

- Added a `unregisterBlockStyle()` function to remove a block style variation.

## 4.0.4 (2018-10-19)

## 4.0.3 (2018-10-18)

## 4.0.0 (2018-09-30)

### Breaking Changes

- `getDefaultBlockForPostFormat` has been removed.

## 3.0.0 (2018-09-05)

### Breaking Changes

- The `isSharedBlock` function is removed. Use `isReusableBlock` instead.
- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).  If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.

### Deprecations

- The `getDefaultBlockForPostFormat` function has been deprecated.
