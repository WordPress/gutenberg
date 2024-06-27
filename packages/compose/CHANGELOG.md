<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 7.2.0 (2024-06-26)

## 7.1.0 (2024-06-15)

## 7.0.0 (2024-05-31)

### Breaking Changes

-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 6.35.0 (2024-05-16)

## 6.34.0 (2024-05-02)

-   Added new `observableMap` data structure and `useObservableValue` React hook ([#60945](https://github.com/WordPress/gutenberg/pull/60945)).

## 6.33.0 (2024-04-19)

## 6.32.0 (2024-04-03)

## 6.31.0 (2024-03-21)

## 6.30.0 (2024-03-06)

## 6.29.0 (2024-02-21)

## 6.28.0 (2024-02-09)

## 6.27.0 (2024-01-24)

### Deprecations

-   The `pure` HoC has been deprecated. Use `memo` or `PureComponent` instead ([#57173](https://github.com/WordPress/gutenberg/pull/57173)).

## 6.26.0 (2024-01-10)

## 6.25.0 (2023-12-13)

## 6.24.0 (2023-11-29)

## 6.23.0 (2023-11-16)

## 6.22.0 (2023-11-02)

## 6.21.0 (2023-10-18)

## 6.20.0 (2023-10-05)

## 6.19.0 (2023-09-20)

### New Features

-   `useStateWithHistory`: Add a new hook to manage state with undo/redo support.

## 6.18.0 (2023-08-31)

## 6.17.0 (2023-08-16)

## 6.16.0 (2023-08-10)

## 6.15.0 (2023-07-20)

## 6.14.0 (2023-07-05)

## 6.13.0 (2023-06-23)

## 6.12.0 (2023-06-07)

## 6.11.0 (2023-05-24)

## 6.10.0 (2023-05-10)

## 6.9.0 (2023-04-26)

## 6.8.0 (2023-04-12)

## 6.7.0 (2023-03-29)

## 6.6.0 (2023-03-15)

## 6.5.0 (2023-03-01)

## 6.4.0 (2023-02-15)

## 6.3.0 (2023-02-01)

## 6.2.0 (2023-01-11)

## 6.1.0 (2023-01-02)

## 6.0.0 (2022-12-14)

### Breaking Changes

-   Updated dependencies to require React 18 ([45235](https://github.com/WordPress/gutenberg/pull/45235))

## 5.20.0 (2022-11-16)

## 5.19.0 (2022-11-02)

### Internal

-   `useDisabled`: Refactor the component to rely on the HTML `inert` attribute ([#44865](https://github.com/WordPress/gutenberg/pull/44865)).
-   `useFocusOutside`: Refactor the hook to TypeScript, rewrite tests using modern RTL and jest features ([#45317](https://github.com/WordPress/gutenberg/pull/45317)).
-   `useFocusableIframe`: Refactor to TypeScript ([#45428](https://github.com/WordPress/gutenberg/pull/45428)).

## 5.18.0 (2022-10-19)

## 5.17.0 (2022-10-05)

## 5.16.0 (2022-09-21)

### New Features

-   Compose: Introduce an in-house `debounce()` utility, deprecate Lodash version ([#43943](https://github.com/WordPress/gutenberg/pull/43943)).
-   Compose: Introduce in-house `compose` and `pipe` utils ([#44112](https://github.com/WordPress/gutenberg/pull/44112)).

### Internal

-   `useInstanceId`: refactor to TypeScript ([#43790](https://github.com/WordPress/gutenberg/pull/43790)).

## 5.15.0 (2022-09-13)

### Internal

-   `useDialog`: refactor to TypeScript ([#43823](https://github.com/WordPress/gutenberg/pull/43823)).

## 5.14.0 (2022-08-24)

## 5.13.0 (2022-08-10)

## 5.12.0 (2022-07-27)

## 5.11.0 (2022-07-13)

## 5.10.0 (2022-06-29)

## 5.9.0 (2022-06-15)

## 5.8.0 (2022-06-01)

## 5.7.0 (2022-05-18)

### Bug Fixes

-   `useRefEffect`: Allow `void` as a valid callback return type ([#40798](https://github.com/WordPress/gutenberg/pull/40798)).

### New Features

-   Add `useDisabled` hook.

### Internal

-   Update the implementation of useResizeObserver to rely on the ResizableObserver API.

## 5.6.0 (2022-05-04)

## 5.5.0 (2022-04-21)

## 5.4.0 (2022-04-08)

## 5.3.0 (2022-03-23)

## 5.2.0 (2022-03-11)

## 5.1.0 (2022-01-27)

## 5.0.0 (2021-07-29)

### Breaking Changes

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 4.2.0 (2021-07-21)

### Deprecations

-   `withState` HOC has been deprecated. Use `useState` hook instead.

### New Features

-   Publish TypeScript types.

## 4.1.0 (2021-05-20)

## 4.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 3.25.0 (2021-03-17)

## 3.24.0 (2021-01-21)

### New Features

-   Add the `useIsomorphicLayoutEffect` hook.

## 3.4.0 (2019-06-12)

### New Features

-   Add the `useMediaQuery` and `useReducedMotion` hooks.

## 3.0.0 (2018-11-15)

### Breaking Changes

-   `remountOnPropChange` has been removed.

## 2.1.2 (2018-11-09)

## 2.1.1 (2018-11-09)

## 2.1.0 (2018-10-29)

### Deprecations

-   `remountOnPropChange` has been deprecated.

## 2.0.5 (2018-10-19)

## 2.0.4 (2018-10-18)

## 2.0.0 (2018-09-05)

### Breaking Changes

-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
