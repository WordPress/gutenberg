## 2.1.0 (2019-01-03)

### Improvements

- The initial viewport state is assigned synchronously, rather than on the next process tick. This should have an impact of fewer callbacks made to data subscribers.

## 2.0.13 (2018-12-12)

## 2.0.12 (2018-11-20)

## 2.0.11 (2018-11-15)

## 2.0.10 (2018-11-09)

## 2.0.9 (2018-11-09)

## 2.0.8 (2018-11-03)

## 2.0.7 (2018-10-30)

## 2.0.5 (2018-10-19)

## 2.0.4 (2018-10-18)

## 2.0.0 (2018-09-05)

### Breaking Change

- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
