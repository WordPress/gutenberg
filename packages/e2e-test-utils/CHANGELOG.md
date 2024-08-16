<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 11.5.0 (2024-08-07)

## 11.4.0 (2024-07-24)

## 11.3.0 (2024-07-10)

## 11.2.0 (2024-06-26)

## 11.1.0 (2024-06-15)

## 11.0.0 (2024-05-31)

### Breaking Changes

-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 10.29.0 (2024-05-16)

## 10.28.0 (2024-05-02)

## 10.27.0 (2024-04-19)

## 10.26.0 (2024-04-03)

## 10.25.0 (2024-03-21)

## 10.24.0 (2024-03-06)

## 10.23.0 (2024-02-21)

## 10.22.0 (2024-02-09)

## 10.21.0 (2024-01-24)

## 10.20.0 (2024-01-10)

## 10.19.0 (2023-12-13)

## 10.18.0 (2023-11-29)

## 10.17.0 (2023-11-16)

## 10.16.0 (2023-11-02)

## 10.15.0 (2023-10-18)

## 10.14.0 (2023-10-05)

## 10.13.0 (2023-09-20)

### Enhancements

-   Update promise order in `loginUser` to avoid any flakiness in the tests.
-   Update `activateTheme` to redirect to `themes.php` after theme activation, if theme redirects to some other page.
-   Update `activatePlugin` to redirect to `plugins.php` after plugin activation, if plugin redirects to some other page.

## 10.12.0 (2023-08-31)

## 10.11.0 (2023-08-16)

## 10.10.0 (2023-08-10)

## 10.9.0 (2023-07-20)

## 10.8.0 (2023-07-05)

## 10.7.0 (2023-06-23)

## 10.6.0 (2023-06-07)

## 10.5.0 (2023-05-24)

## 10.4.0 (2023-05-10)

## 10.3.0 (2023-04-26)

## 10.2.0 (2023-04-12)

## 10.1.0 (2023-03-29)

## 10.0.0 (2023-03-15)

### Breaking Changes

-   Started requiring Jest v29 instead of v27 as a peer dependency. See [breaking changes in Jest 28](https://jestjs.io/blog/2022/04/25/jest-28) and [in jest 29](https://jestjs.io/blog/2022/08/25/jest-29) ([#47388](https://github.com/WordPress/gutenberg/pull/47388))

## 9.5.0 (2023-03-01)

## 9.4.0 (2023-02-15)

## 9.3.0 (2023-02-01)

## 9.2.0 (2023-01-11)

## 9.1.0 (2023-01-02)

## 9.0.0 (2022-12-14)

### Breaking Changes

-   Remove all the site editor navigation panel related utils: getSiteEditorMenuItem, isSiteEditorRoot, navigateSiteEditorBack, navigateSiteEditorBackToRoot, openSiteEditorNavigationPanel, siteEditorNavigateSequence, clickSiteEditorMenuItem, closeSiteEditorNavigationPanel.

## 8.6.0 (2022-11-16)

## 8.5.0 (2022-11-02)

## 8.4.0 (2022-10-19)

## 8.3.0 (2022-10-05)

### Bug Fixes

-   Don't use hardcoded login credentials when requesting nonce ([#44331](https://github.com/WordPress/gutenberg/pull/44331)).

## 8.2.0 (2022-09-21)

## 8.0.0 (2022-08-24)

### Breaking Changes

-   Increase the minimum Node.js version to 14 ([#43141](https://github.com/WordPress/gutenberg/pull/43141)).

## 7.2.0 (2022-04-08)

### Enhancements

-   Changed `setOption` to use `options.php`, to allow setting any option (and to be more consistent with `getOption`). [#39502](https://github.com/WordPress/gutenberg/pull/39502)
-   Changed `setOption` to return the changed setting's previous value (to make restoring it easier). [#39502](https://github.com/WordPress/gutenberg/pull/39502)
-   Added a new `trashAllComments` function.

## 7.0.0 (2022-03-11)

### Breaking Changes

-   Updated `clickMenuItem` method to use exact label matching instead of partial [#39274](https://github.com/WordPress/gutenberg/pull/39274).

### Enhancements

-   The `toggleMoreMenu` and `clickMoreMenuItem` utilities no longer require a second 'context' parameter.

## 6.0.0 (2022-01-27)

### Breaking Changes

-   The peer `jest` dependency has been updated from requiring `>=26` to requiring `>=27` (see [Breaking Changes](https://jestjs.io/blog/2021/05/25/jest-27), [#33287](https://github.com/WordPress/gutenberg/pull/33287)).
-   The peer `puppeteer` dependency has been replaced with `puppeteer-core` requiring version `>=11` (see [Breaking Changes](https://github.com/puppeteer/puppeteer/releases/tag/v11.0.0), [#36040](https://github.com/WordPress/gutenberg/pull/36040)).

### New Features

-   Added `createReusableBlock` function to make it easier to create a simple reusable block ([#37333](https://github.com/WordPress/gutenberg/pull/37333)).
-   Added `getOption` and `setOption` functions to make it easier to set and reset options such as the site title and site tagline ([#37139](https://github.com/WordPress/gutenberg/pull/37139)).

## 5.4.6 (2021-11-07)

### New Features

-   Added `disablePageDialogAccept` - Disable auto-accepting dialogs enabled by `enablePageDialogAccept` [#35828](https://github.com/WordPress/gutenberg/pull/35828).

## 5.4.0 (2021-07-21)

### New Features

-   Added `createUser` and `deleteUser` - Create and delete a user account, respectively.
-   Added `getCurrentUser` - Determine the currently logged in user. Changed `switchUserToAdmin` and `switchUserToTest` to use it.

## 5.3.0 (2021-05-31)

### New Features

-   Added `deleteAllWidgets` - Delete all widgets in the widgets screen.

## 5.0.0 (2021-01-21)

### Breaking Changes

-   `toggleScreenOption` util has been removed, since `Preferences` modal was redesigned. Use `togglePreferencesOption` instead ([#28329](https://github.com/WordPress/gutenberg/pull/28329)).

-   Increase the minimum Node.js version to 12 ([#27934](https://github.com/WordPress/gutenberg/pull/27934)).

## 4.16.0 (2020-12-17)

### New Features

-   Added `clickMenuItem` - clicks the item that matches the label in the opened menu.

## 4.5.0 (2020-04-15)

### Enhancements

-   `visitAdminPage` will now throw an error (emit a test failure) when there are unexpected errors on hte page.

### New Features

-   Added `getPageError` function, returning a promise which resolves to an error message present in the page, if any exists.

## 4.0.0 (2019-12-19)

### Breaking Changes

-   The disableNavigationMode utility was removed. By default, the editor is in edit mode now.

### Enhancements

-   `setBrowserViewport` accepts an object of `width`, `height` values, to assign a viewport of arbitrary size.

## 3.0.0 (2019-11-14)

### Breaking Changes

-   The util function `enableExperimentalFeatures` was removed. It is now available for internal usage in the `e2e-tests` package.

## 2.0.0 (2019-05-21)

### Breaking Changes

-   The minimum version of Gutenberg `5.6.0` or the minimum version of WordPress `5.2.0`.

### Bug Fixes

-   WordPress 5.2: Fix a false positive build failure caused by Dashicons font file.
-   WordPress 5.2: Fix a test failure for Classic Block media insertion caused by a change in tooltips text ([rWP45066](https://core.trac.wordpress.org/changeset/45066)).

## 1.1.0 (2019-03-20)

### New Features

-   New Function: `getAllBlockInserterItemTitles` - Returns an array of strings with all inserter item titles.
-   New Function: `openAllBlockInserterCategories` - Opens all block inserter categories.
-   New Function: `getAllBlockInserterItemTitles` - Opens the global block inserter.

### Breaking Changes

-   The minimum version of Gutenberg `5.3.0` or the minimum version of WordPress `5.2.0`.

## 1.0.0 (2019-03-06)

### New Features

-   Initial release. The minimum version of Gutenberg `5.2.0` or the minimum version of WordPress `5.2.0`.
