## 2.0.0 (Unreleased)

### Breaking Change

- `dispatch("core").receiveTerms` has been deprecated. Please use `dispatch("core").receiveEntityRecords` instead.
- `getCategories` resolvers has been deprecated. Please use `getEntityRecords` resolver instead.
- `select("core").getTerms` has been deprecated. Please use `select("core").getEntityRecords` instead.
- `select("core").getCategories` has been deprecated. Please use `select("core").getEntityRecords` instead.
- `wp.data.select("core").isRequestingCategories` has been deprecated. Please use `wp.data.select("core/data").isResolving` instead.
- `select("core").isRequestingTerms` has been deprecated. Please use `select("core").isResolving` instead.
- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).  If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
