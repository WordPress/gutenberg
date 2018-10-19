## 3.0.1 (Unreleased)

### Bug Fix

- Account for null value in redux-routine createRuntime (introduces `isAction` and `isActionOfType` methods to assist with that).

## 3.0.0 (2018-09-30)

### Breaking change

- The middleware returns a promise resolving once the runtime finishes iterating over the generator.
- It's not possible to kill the execution of the runtime anymore by returning `undefined`

## Bug Fixes

- Fix running routines in Firefox.

## 2.0.0 (2018-09-05)

### Breaking Change

- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).  If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
