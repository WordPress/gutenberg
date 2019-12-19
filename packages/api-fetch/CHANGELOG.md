## 3.8.0 (2019-12-19)

### Bug Fixes

- Resolves an issue with `createPreloadingMiddleware` where the preloaded data is assumed to be provided with keys matching the internal normalized value.

## 3.0.0 (2019-03-06)

### Breaking Changes

- A created nonce middleware will no longer automatically listen for `heartbeat.tick` actions. Assign to the new `nonce` middleware property instead.

### New Feature

- The function returned by `createNonceMiddleware` includes an assignable `nonce` property corresponding to the active nonce to be used.
- Default fetch handler can be overridden with a custom fetch handler

## 2.2.6 (2018-12-12)

## 2.2.5 (2018-11-20)

## 2.2.4 (2018-11-15)

## 2.2.3 (2018-11-12)

## 2.2.2 (2018-11-03)

## 2.2.1 (2018-10-30)

## 2.2.0 (2018-10-29)

### New Feature

- Always request data in the user's locale ([#10862](https://github.com/WordPress/gutenberg/pull/10862)).

## 2.1.0 (2018-10-22)

### New Feature

- Support `per_page=-1` paginated requests.

## 2.0.0 (2018-09-05)

### Breaking Change

- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
