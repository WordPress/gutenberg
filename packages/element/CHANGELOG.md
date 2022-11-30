<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 4.20.0 (2022-11-16)

## 4.19.0 (2022-11-02)

## 4.18.0 (2022-10-19)

## 4.17.0 (2022-10-05)

## 4.16.0 (2022-09-21)

## 4.15.0 (2022-09-13)

## 4.14.0 (2022-08-24)

### Bug Fix

-   Packages: Replace `is-plain-obj` with `is-plain-object` ([#43511](https://github.com/WordPress/gutenberg/pull/43511)).

## 4.13.0 (2022-08-10)

## 4.12.0 (2022-07-27)

## 4.11.0 (2022-07-13)

## 4.10.0 (2022-06-29)

## 4.9.0 (2022-06-15)

## 4.8.0 (2022-06-01)

## 4.7.0 (2022-05-18)

## 4.6.0 (2022-05-04)

## 4.5.0 (2022-04-21)

## 4.4.0 (2022-04-08)

## 4.3.0 (2022-03-23)

## 4.2.0 (2022-03-11)

### Bug Fix

- Serialize will now keep correct casing for SVG attributes ([#38936](https://github.com/WordPress/gutenberg/pull/38936)).

## 4.1.0 (2022-01-27)

### Bug Fix

-   Ensure that the package uses the latest version of React types ([#37365](https://github.com/WordPress/gutenberg/pull/37365)).

## 4.0.3 (2021-10-22)

### Bug Fix

-   Update `rawHtml` to correctly concatenate multiple strings passed as children (see [35532](https://github.com/WordPress/gutenberg/pull/35532))

## 4.0.0 (2021-07-29)

### Breaking Change

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 3.2.0 (2021-07-21)

## 3.1.0 (2021-05-20)

## 3.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 2.20.0 (2021-03-17)

## 2.17.1 (2020-09-17)

### Bug fix

-   Declare @types/react and @types/react-dom dependencies which could cause type errors when using
    this package with TypeScript ([#25086](https://github.com/WordPress/gutenberg/pull/25086))

## 2.14.0 (2020-05-14)

### New Feature

-   Include TypeScript type declarations ([#21781](https://github.com/WordPress/gutenberg/pull/21781))

## 2.13.1 (2020-04-15)

### Bug Fix

-   Hide TypeScript type declarations ([#21613](https://github.com/WordPress/gutenberg/pull/21613))
    after they were found to conflict with DefinitelyTyped provided declarations.

## 2.13.0 (2020-04-15)

### New Features

-   Include TypeScript type declarations ([#21248](https://github.com/WordPress/gutenberg/pull/21248))
-   Graduated `__experimentalCreateInterpolateElement` function to stable api: `createInterpolateElement` (see [20699](https://github.com/WordPress/gutenberg/pull/20699))

## 2.10.0 (2019-12-19)

### New Features

-   Added `__experimentalCreateInterpolateElement` function (see [17376](https://github.com/WordPress/gutenberg/pull/17376))

## 2.8.0 (2019-09-16)

### New Features

-   The bundled `react` dependency has been updated from requiring `^16.8.4` to requiring `^16.9.0` ([#16982](https://github.com/WordPress/gutenberg/pull/16982)). It contains [new deprecations](https://reactjs.org/blog/2019/08/08/react-v16.9.0.html#new-deprecations) as well.
-   The bundled `react-dom` dependency has been updated from requiring `^16.8.4` to requiring `^16.9.0` ([#16982](https://github.com/WordPress/gutenberg/pull/16982)).

## 2.4.0 (2019-05-21)

### New Features

-   Added `lazy` feautre (see: https://reactjs.org/docs/react-api.html#reactlazy).
-   Added `Suspense` component (see: https://reactjs.org/docs/react-api.html#reactsuspense).

## 2.3.0 (2019-03-06)

### New Features

-   Added `useCallback` hook (see: https://reactjs.org/docs/hooks-reference.html#usecallback).
-   Added `useContext` hook (see: https://reactjs.org/docs/hooks-reference.html#usecontext).
-   Added `useDebugValue` hook (see: https://reactjs.org/docs/hooks-reference.html#usedebugvalue).
-   Added `useEffect` hook (see: https://reactjs.org/docs/hooks-reference.html#useeffect).
-   Added `useImperativeHandle` hook (see: https://reactjs.org/docs/hooks-reference.html#useimperativehandle).
-   Added `useLayoutEffect` hook (see: https://reactjs.org/docs/hooks-reference.html#uselayouteffect).
-   Added `useMemo` hook (see: https://reactjs.org/docs/hooks-reference.html#usememo).
-   Added `useReducer` hook (see: https://reactjs.org/docs/hooks-reference.html#usereducer).
-   Added `useRef` hook (see: https://reactjs.org/docs/hooks-reference.html#useref).
-   Added `useState` hook (see: https://reactjs.org/docs/hooks-reference.html#usestate).

## 2.1.8 (2018-11-15)

## 2.1.7 (2018-11-09)

## 2.1.6 (2018-11-09)

## 2.1.5 (2018-10-29)

## 2.1.4 (2018-10-20)

## 2.1.3 (2018-10-18)

## 2.1.0 (2018-09-30)

-   New API method `isEmptyElement` was introduced ([9861](https://github.com/WordPress/gutenberg/pull/9681/)).

## 2.0.0 (2018-09-05)

### Breaking Change

-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
