## 2.1.0 (2019-03-06)

### Bug Fix

- Update `isHorizontalEdge` to account for empty text nodes.
- `tabbables.find` considers at most a single radio input for a given name. The checked input is given priority, falling back to the first in the tabindex-sorted set if there is no checked input.

## 2.0.8 (2019-01-03)

## 2.0.7 (2018-11-20)

## 2.0.6 (2018-11-09)

## 2.0.5 (2018-11-09)

## 2.0.4 (2018-10-19)

## 2.0.3 (2018-10-18)

## 2.0.0 (2018-09-05)

### Breaking Change

- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
