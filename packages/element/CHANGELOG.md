## 2.1.8 (2018-11-15)

## 2.1.7 (2018-11-09)

## 2.1.6 (2018-11-09)

## 2.1.5 (2018-10-29)

## 2.1.4 (2018-10-20)

## 2.1.3 (2018-10-18)

## 2.1.0 (2018-09-30)

- New API method `isEmptyElement` was introduced ([9861](https://github.com/WordPress/gutenberg/pull/9681/)).

## 2.0.0 (2018-09-05)

### Breaking Change

- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).  If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
