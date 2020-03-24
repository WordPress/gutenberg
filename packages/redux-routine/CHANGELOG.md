## Master

## 3.7.0 (2020-02-04)

### Bug Fix

- Change the `isGenerator` check for better compatibility with generator helper libraries ([#19666](https://github.com/WordPress/gutenberg/pull/19666)).

## 3.1.0 (2019-03-06)

### Bug Fixes

- Fix unhandled promise rejection error caused by returning null from registered generator ([#13314](https://github.com/WordPress/gutenberg/pull/13314))
- The middleware will no longer attempt to coerce an error to an instance of `Error`, and instead passes through the thrown value directly. This resolves issues where an `Error` would be thrown when the underlying values were not of type `Error` or `string` (e.g. a thrown object) and the message would end up not being useful (e.g. `[Object object]`).
([#13315](https://github.com/WordPress/gutenberg/pull/13315))
- Fix unintended recursion when invoking sync routine ([#13818](https://github.com/WordPress/gutenberg/pull/13818))

## 3.0.3 (2018-10-19)

## 3.0.2 (2018-10-18)

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
