<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/master/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Added a component wrapper `FilteredComponent` that makes it possible to integrate WordPress hooks API applied to components with Plugins API ([#26655](https://github.com/WordPress/gutenberg/pull/26655)).
-   Added a factory method `createFilteredComponent` that creates a new variation of `FilteredComponent` component, with a provided hook name set, to be used with Plugins API ([#26655](https://github.com/WordPress/gutenberg/pull/26655)).

## 2.0.10 (2019-01-03)

## 2.0.9 (2018-11-15)

## 2.0.8 (2018-11-09)

## 2.0.7 (2018-11-09)

## 2.0.6 (2018-10-29)

## 2.0.5 (2018-10-20)

## 2.0.4 (2018-10-18)

## 2.0.0 (2018-09-05)

### Breaking Change

-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
