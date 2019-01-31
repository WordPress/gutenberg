## 3.0.0 (2018-11-15)

### Breaking Changes

- `remountOnPropChange` has been removed.

## 2.1.2 (2018-11-09)

## 2.1.1 (2018-11-09)

## 2.1.0 (2018-10-29)

### Deprecation

- `remountOnPropChange` has been deprecated.

## 2.0.5 (2018-10-19)

## 2.0.4 (2018-10-18)

## 2.0.0 (2018-09-05)

### Breaking Change

- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).  If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
