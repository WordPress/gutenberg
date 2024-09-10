<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 7.7.0 (2024-09-05)

## 7.6.0 (2024-08-21)

## 7.5.0 (2024-08-07)

## 7.4.0 (2024-07-24)

## 7.3.0 (2024-07-10)

## 7.2.0 (2024-06-26)

## 7.1.0 (2024-06-15)

## 7.0.0 (2024-05-31)

### Breaking Changes

-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 6.55.0 (2024-05-16)

## 6.54.0 (2024-05-02)

## 6.53.0 (2024-04-19)

## 6.52.0 (2024-04-03)

## 6.51.0 (2024-03-21)

## 6.50.0 (2024-03-06)

## 6.49.0 (2024-02-21)

## 6.48.0 (2024-02-09)

## 6.47.0 (2024-01-24)

## 6.46.0 (2024-01-10)

## 6.45.0 (2023-12-13)

## 6.44.0 (2023-11-29)

## 6.43.0 (2023-11-16)

## 6.42.0 (2023-11-02)

## 6.41.0 (2023-10-18)

## 6.40.0 (2023-10-05)

## 6.39.0 (2023-09-20)

## 6.38.0 (2023-08-31)

## 6.37.0 (2023-08-16)

## 6.36.0 (2023-08-10)

## 6.35.0 (2023-07-20)

## 6.34.0 (2023-07-05)

## 6.33.0 (2023-06-23)

## 6.32.0 (2023-06-07)

## 6.31.0 (2023-05-24)

## 6.30.0 (2023-05-10)

## 6.29.0 (2023-04-26)

## 6.28.0 (2023-04-12)

## 6.27.0 (2023-03-29)

## 6.26.0 (2023-03-15)

## 6.25.0 (2023-03-01)

## 6.24.0 (2023-02-15)

## 6.23.0 (2023-02-01)

## 6.22.0 (2023-01-11)

## 6.21.0 (2023-01-02)

## 6.20.0 (2022-12-14)

## 6.19.0 (2022-11-16)

## 6.18.0 (2022-11-02)

## 6.17.0 (2022-10-19)

## 6.16.0 (2022-10-05)

## 6.15.0 (2022-09-21)

## 6.14.0 (2022-09-13)

## 6.13.0 (2022-08-24)

## 6.12.0 (2022-08-10)

## 6.11.0 (2022-07-27)

## 6.10.0 (2022-07-13)

## 6.9.0 (2022-06-29)

## 6.8.0 (2022-06-15)

## 6.7.0 (2022-06-01)

## 6.6.0 (2022-05-18)

## 6.5.0 (2022-05-04)

## 6.4.0 (2022-04-21)

## 6.3.0 (2022-04-08)

## 6.2.0 (2022-03-23)

## 6.1.0 (2022-03-11)

## 6.0.0 (2022-01-27)

### Breaking Changes

`OPTIONS` requests handled by the preloading middleware are now resolved as `window.Response` objects if you explicitly set `parse: false` (for consistency with how GET requests are resolved). They used to be resolved as `Plain Old JavaScript Objects`.

## 5.2.5 (2021-11-07)

### Internal

-   Removed `getStablePath` function. Please use `normalizePath` from `@wordpress/url` package instead ([#35992](https://github.com/WordPress/gutenberg/pull/35992)).``

## 5.2.0 (2021-07-21)

### New Features

-   `AbortError` being thrown by the default fetch handler can now be caught and handled separately in user-land. Add documentation about aborting a request ([#32530](https://github.com/WordPress/gutenberg/pull/32530)).

## 5.1.0 (2021-05-20)

## 5.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 4.0.0 (2021-04-29)

### Breaking Changes

-   `OPTIONS` requests which are handled by the preloading middleware are no longer resolved as unparsed responses unless you explicitly set `parse: false`, for consistency with other request methods. If you expect an unparsed response, add `{ parse: false }` to your request options to preserve the previous behavior.

## 3.23.1 (2021-04-15)

### Bug Fixes

-   Align exported type names with the DefinitelyTyped type names and actually export those types.

## 3.23.0 (2021-04-06)

### New Features

-   Publish TypeScript definitions.

## 3.22.0 (2021-03-17)

## 3.8.1 (2019-04-22)

-   Added deprecation to `useApiFetch` hook.
-   Added `@wordpress/deprecation` package to add deprecation notice to `useApiFetch` hook.

## 3.8.0 (2019-12-19)

### Bug Fixes

-   Resolves an issue with `createPreloadingMiddleware` where the preloaded data is assumed to be provided with keys matching the internal normalized value.

## 3.0.0 (2019-03-06)

### Breaking Changes

-   A created nonce middleware will no longer automatically listen for `heartbeat.tick` actions. Assign to the new `nonce` middleware property instead.

### New Features

-   The function returned by `createNonceMiddleware` includes an assignable `nonce` property corresponding to the active nonce to be used.
-   Default fetch handler can be overridden with a custom fetch handler

## 2.2.6 (2018-12-12)

## 2.2.5 (2018-11-20)

## 2.2.4 (2018-11-15)

## 2.2.3 (2018-11-12)

## 2.2.2 (2018-11-03)

## 2.2.1 (2018-10-30)

## 2.2.0 (2018-10-29)

### New Features

-   Always request data in the user's locale ([#10862](https://github.com/WordPress/gutenberg/pull/10862)).

## 2.1.0 (2018-10-22)

### New Features

-   Support `per_page=-1` paginated requests.

## 2.0.0 (2018-09-05)

### Breaking Changes

-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
