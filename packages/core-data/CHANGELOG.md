## 2.0.16 (2019-01-03)

### Bug Fixes

- Fixed the `hasUploadPermissions` selector to always return a boolean. Previously, it may have returned an empty object. This should have no impact for most consumers, assuming usage as a [truthy value](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) in conditions.

## 2.0.15 (2018-12-12)

## 2.0.14 (2018-11-20)

## 2.0.13 (2018-11-15)

## 2.0.12 (2018-11-12)

## 2.0.11 (2018-11-09)

## 2.0.10 (2018-11-09)

## 2.0.9 (2018-11-03)

## 2.0.8 (2018-10-30)

## 2.0.6 (2018-10-22)

## 2.0.5 (2018-10-19)

## 2.0.4 (2018-10-18)

## 2.0.0 (2018-09-05)

### Breaking Change

- `dispatch("core").receiveTerms` has been deprecated. Please use `dispatch("core").receiveEntityRecords` instead.
- `getCategories` resolvers has been deprecated. Please use `getEntityRecords` resolver instead.
- `select("core").getTerms` has been deprecated. Please use `select("core").getEntityRecords` instead.
- `select("core").getCategories` has been deprecated. Please use `select("core").getEntityRecords` instead.
- `wp.data.select("core").isRequestingCategories` has been deprecated. Please use `wp.data.select("core/data").isResolving` instead.
- `select("core").isRequestingTerms` has been deprecated. Please use `select("core").isResolving` instead.
- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
