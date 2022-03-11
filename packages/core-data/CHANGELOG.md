<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased
–   The saveEntityRecord, saveEditedEntityRecord, and deleteEntityRecord actions now accept an optional throwOnError option (defaults to false). When set to true, any exceptions occurring when the action was executing are re-thrown, causing dispatch().saveEntityRecord() to reject with an error. ([#39258](https://github.com/WordPress/gutenberg/pull/39258))

## 4.2.0 (2022-03-11)

## 4.1.2 (2022-02-23)

### Bug Fixes

-   The `canUser` no longer uses the `GET` request with the resource ID argument [#38901](https://github.com/WordPress/gutenberg/pull/38901).

## 4.1.0 (2022-01-27)

### Bug Fixes

-   `getEntityRecords` no longer returns an empty array for unknown entities but returns `null` instead. `hasEntityRecords` now also returns `false` when the entity configuration is unknown. ([#36984](https://github.com/WordPress/gutenberg/pull/36984))

## 4.0.0 (2021-07-29)

### Breaking Change

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 3.2.0 (2021-07-21)

## 3.1.0 (2021-05-20)

## 3.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

### Enhancements

-   The `getEntityRecords` resolver has been updated and now uses the batched variants of start and finish resolution actions.

## 2.26.0 (2021-03-17)

## 2.25.0 (2020-12-17)

### New Feature

-   Added a store definition `store` for the core data namespace to use with `@wordpress/data` API ([#26655](https://github.com/WordPress/gutenberg/pull/26655)).

## 2.21.0 (2020-09-03)

### New Feature

-   The `deleteEntityRecord` and `removeItems` actions have been added.
-   The `isDeletingEntityRecord` and `getLastEntityDeleteError` selectors have been added.
-   A `delete<entity.name>` helper is created for every registered entity.

## 2.3.0 (2019-05-21)

### New features

-   The `getAutosave`, `getAutosaves` and `getCurrentUser` selectors have been added.
-   The `receiveAutosaves` and `receiveCurrentUser` actions have been added.

## 2.0.16 (2019-01-03)

### Bug Fixes

-   Fixed the `hasUploadPermissions` selector to always return a boolean. Previously, it may have returned an empty object. This should have no impact for most consumers, assuming usage as a [truthy value](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) in conditions.

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

-   `dispatch("core").receiveTerms` has been deprecated. Please use `dispatch("core").receiveEntityRecords` instead.
-   `getCategories` resolvers has been deprecated. Please use `getEntityRecords` resolver instead.
-   `select("core").getTerms` has been deprecated. Please use `select("core").getEntityRecords` instead.
-   `select("core").getCategories` has been deprecated. Please use `select("core").getEntityRecords` instead.
-   `wp.data.select("core").isRequestingCategories` has been deprecated. Please use `wp.data.select("core/data").isResolving` instead.
-   `select("core").isRequestingTerms` has been deprecated. Please use `select("core").isResolving` instead.
-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
