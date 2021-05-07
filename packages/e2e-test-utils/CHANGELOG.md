<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 5.0.0 (2021-01-21)

### Breaking Changes

-   `toggleScreenOption` util has been removed, since `Preferences` modal was redesigned. Use `togglePreferencesOption` instead ([#28329](https://github.com/WordPress/gutenberg/pull/28329)).

-   Increase the minimum Node.js version to 12 ([#27934](https://github.com/WordPress/gutenberg/pull/27934)).

## 4.16.0 (2020-12-17)

### Nee Features

-   Added `clickMenuItem` - clicks the item that matches the label in the opened menu.

## 4.5.0 (2020-04-15)

### Enhancements

-   `visitAdminPage` will now throw an error (emit a test failure) when there are unexpected errors on hte page.

### New Features

-   Added `getPageError` function, returning a promise which resolves to an error message present in the page, if any exists.

## 4.0.0 (2019-12-19)

### Breaking Changes

-   The disableNavigationMode utility was removed. By default, the editor is in edit mode now.

### Improvements

-   `setBrowserViewport` accepts an object of `width`, `height` values, to assign a viewport of arbitrary size.

## 3.0.0 (2019-11-14)

### Breaking Changes

-   The util function `enableExperimentalFeatures` was removed. It is now available for internal usage in the `e2e-tests` package.

## 2.0.0 (2019-05-21)

### Requirements

-   The minimum version of Gutenberg `5.6.0` or the minimum version of WordPress `5.2.0`.

### Bug Fixes

-   WordPress 5.2: Fix a false positive build failure caused by Dashicons font file.
-   WordPress 5.2: Fix a test failure for Classic Block media insertion caused by a change in tooltips text ([rWP45066](https://core.trac.wordpress.org/changeset/45066)).

## 1.1.0 (2019-03-20)

### New Features

-   New Function: `getAllBlockInserterItemTitles` - Returns an array of strings with all inserter item titles.
-   New Function: `openAllBlockInserterCategories` - Opens all block inserter categories.
-   New Function: `getAllBlockInserterItemTitles` - Opens the global block inserter.

### Requirements

-   The minimum version of Gutenberg `5.3.0` or the minimum version of WordPress `5.2.0`.

## 1.0.0 (2019-03-06)

### New Features

-   Initial release.

### Requirements

-   The minimum version of Gutenberg `5.2.0` or the minimum version of WordPress `5.2.0`.
