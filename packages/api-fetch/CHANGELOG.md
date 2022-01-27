<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 6.0.0 (2022-01-27)

### Breaking changes

   `OPTIONS` requests handled by the preloading middleware are now resolved as `window.Response` objects if you explicitly set `parse: false` (for consistency with how GET requests are resolved). They used to be resolved as `Plain Old JavaScript Objects`.

## 5.2.5 (2021-11-07)

### Internal

-   Removed `getStablePath` function. Please use `normalizePath` from `@wordpress/url` package instead ([#35992](https://github.com/WordPress/gutenberg/pull/35992)).``

## 5.2.0 (2021-07-21)

### New feature

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

### New Feature

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

### New Feature

-   The function returned by `createNonceMiddleware` includes an assignable `nonce` property corresponding to the active nonce to be used.
-   Default fetch handler can be overridden with a custom fetch handler

## 2.2.6 (2018-12-12)

## 2.2.5 (2018-11-20)

## 2.2.4 (2018-11-15)

## 2.2.3 (2018-11-12)

## 2.2.2 (2018-11-03)

## 2.2.1 (2018-10-30)

## 2.2.0 (2018-10-29)

### New Feature

-   Always request data in the user's locale ([#10862](https://github.com/WordPress/gutenberg/pull/10862)).

## 2.1.0 (2018-10-22)

### New Feature

-   Support `per_page=-1` paginated requests.

## 2.0.0 (2018-09-05)

### Breaking Change

-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
