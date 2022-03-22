<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 5.2.0 (2022-03-11)

## 5.1.1 (2022-02-10)

### Bug Fix

-   Removed unused `@wordpress/dom`, `@wordpress/is-shallow-equal` and `classnames` dependencies ([#38388](https://github.com/WordPress/gutenberg/pull/38388)).

## 5.1.0 (2022-01-27)

## 5.0.0 (2021-07-29)

### Breaking Change

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 4.2.0 (2021-07-21)

## 4.1.0 (2021-05-20)

## 4.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 3.25.0 (2021-03-17)

## 3.24.0 (2020-12-17)

### New Feature

-   Added a store definition `store` for the rich-text namespace to use with `@wordpress/data` API ([#26655](https://github.com/WordPress/gutenberg/pull/26655)).

## 3.3.0 (2019-05-21)

### Internal

-   Removed and renamed undocumented functions and constants:
    -   Removed `charAt`
    -   Removed `getSelectionStart`
    -   Removed `getSelectionEnd`
    -   Removed `insertLineBreak`
    -   Renamed `isEmptyLine` to `__unstableIsEmptyLine`
    -   Renamed `insertLineSeparator` to `__unstableInsertLineSeparator`
    -   Renamed `apply` to `__unstableApply`
    -   Renamed `unstableToDom` to `__unstableToDom`
    -   Renamed `LINE_SEPARATOR` to `__UNSTABLE_LINE_SEPARATOR`
    -   Renamed `indentListItems` to `__unstableIndentListItems`
    -   Renamed `outdentListItems` to `__unstableOutdentListItems`
    -   Renamed `changeListType` to `__unstableChangeListType`

## 3.1.0 (2019-03-06)

### Enhancement

-   Added format boundaries.
-   Removed parameters from `create` to filter out content.
-   Removed the `createLinePadding` from `apply`, which is now built in.
-   Improved format placeholder.
-   Improved dom diffing.

## 3.0.4 (2019-01-03)

## 3.0.3 (2018-12-12)

### Internal

-   Internal performance optimizations to avoid excessive expensive creation of DOM documents.

## 3.0.2 (2018-11-21)

## 3.0.1 (2018-11-20)

## 3.0.0 (2018-11-15)

### Breaking Changes

-   `toHTMLString` always expects an object instead of multiple arguments.

## 2.0.4 (2018-11-09)

## 2.0.3 (2018-11-09)

### Bug Fix

-   Fix Format Type Assignment During Parsing.
-   Fix applying formats on multiline values without wrapper tags.

## 2.0.2 (2018-11-03)

## 2.0.1 (2018-10-30)

## 2.0.0 (2018-10-30)

-   Remove `@wordpress/blocks` as a dependency.

## 1.0.2 (2018-10-29)

## 1.0.1 (2018-10-19)

## 1.0.0 (2018-10-18)

-   Initial release.
