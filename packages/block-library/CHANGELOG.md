<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 8.13.0 (2023-06-23)

## 8.12.0 (2023-06-07)

## 8.11.0 (2023-05-24)

## 8.10.0 (2023-05-10)

## 8.9.0 (2023-04-26)

## 8.8.0 (2023-04-12)

## 8.7.0 (2023-03-29)

## 8.6.0 (2023-03-15)

## 8.5.0 (2023-03-01)

## 8.4.0 (2023-02-15)

## 8.3.0 (2023-02-01)

## 8.2.0 (2023-01-11)

## 8.1.0 (2023-01-02)

## 8.0.0 (2022-12-14)

### Breaking Changes

-   Updated dependencies to require React 18 ([45235](https://github.com/WordPress/gutenberg/pull/45235))

## 7.19.0 (2022-11-16)

## 7.18.0 (2022-11-02)

## 7.17.0 (2022-10-19)

## 7.16.0 (2022-10-05)

## 7.15.0 (2022-09-21)

## 7.14.0 (2022-09-13)

### New Feature

-   Made it possible to import individual blocks ([#42258](https://github.com/WordPress/gutenberg/pull/42258)). Check [README](./README.md#loading-individual-blocks) for more information.

## 7.13.0 (2022-08-24)

### Bug Fix

-   Ensure all dependencies allow version ranges ([#43355](https://github.com/WordPress/gutenberg/pull/43355)).

## 7.12.0 (2022-08-10)

## 7.11.0 (2022-07-27)

## 7.10.0 (2022-07-13)

## 7.9.0 (2022-06-29)

## 7.8.0 (2022-06-15)

## 7.7.0 (2022-06-01)

## 7.6.0 (2022-05-18)

### Enhancement

-   Declare blocks as \_\_experimental in block.json to automate syncing Gutenberg packages to WordPress ([#40655](https://github.com/WordPress/gutenberg/pull/40655)).

## 7.5.0 (2022-05-04)

## 7.4.0 (2022-04-21)

## 7.3.0 (2022-04-08)

## 7.2.0 (2022-03-23)

### Bug Fix

-   Table block: Fix deprecation eligibility to prevent loss of named (color palette) background color ([#39445](https://github.com/WordPress/gutenberg/pull/39445)).

### Enhancement

-   Social Icons: Avoid loss of previously selected background color when switching back from "Logos Only" style ([#39276](https://github.com/WordPress/gutenberg/pull/39276)).

## 7.1.0 (2022-03-11)

## 7.0.0 (2022-02-10)

### Breaking Change

-   The `GUTENBERG_PHASE` environment variable has been renamed to `IS_GUTENBERG_PLUGIN` and is now a boolean ([#38202](https://github.com/WordPress/gutenberg/pull/38202)).

### Bug Fix

-   Gallery block: disable edit as html support ([#39318](https://github.com/WordPress/gutenberg/pull/39318)).
-   Removed unused `@wordpress/escape-html` and `@wordpress/is-shallow-equal` dependencies ([#38388](https://github.com/WordPress/gutenberg/pull/38388)).

## 6.1.0 (2022-01-27)

-   Code quality: Add block schema to each core block ([#35900](https://github.com/WordPress/gutenberg/pull/35900)).

## 6.0.0 (2021-09-09)

### Breaking Change

-   Remove the background-colors, foreground-colors, and gradient-colors mixins.

## 5.0.0 (2021-07-29)

### Breaking Change

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

## 4.0.0 (2021-07-21)

### Breaking Changes

-   Removes the `core/legacy-widget` block. This is now in `@wordpress/widgets` via `registerLegacyWidgetBlock()`.

### Bug Fixes

-   Include missing attributes when upgrading embed block ([#33235](https://github.com/WordPress/gutenberg/pull/33235))

## 3.2.0 (2021-05-24)

### New Features

-   Marks the `core/legacy-widget` block as stable.

## 3.1.0 (2021-05-20)

## 3.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 2.29.0 (2021-03-17)

### Bug Fixes

-   Fix a regression where the Cover block migration would not work with a non-default contentPosition ([#29542](https://github.com/WordPress/gutenberg/pull/29542))

## 2.28.0 (2021-02-01)

### New Features

-   Allow setting the `crossOrigin` attribute so the `useTransformImage` hook can use cross-origin sources ([#28255](https://github.com/WordPress/gutenberg/pull/28255/)).

### Bug Fixes

-   Fix a regression where the Cover block migration would not work with custom units for `minHeight` ([#28627](https://github.com/WordPress/gutenberg/pull/28627))

## 2.27.0 (2020-12-17)

### Enhancement

-   File Block: Copy url button is moved to Block toolbar.
-   Code and Preformatted Blocks: delete on backspace from an empty block.

### Bug Fixes

-   Fix a regression where the Cover would not show opacity controls for the default overlay color ([#26625](https://github.com/WordPress/gutenberg/pull/26625)).
-   Fix a regression ([#26545](https://github.com/WordPress/gutenberg/pull/26545)) where the Cover block lost its default background overlay color
    ([#26569](https://github.com/WordPress/gutenberg/pull/26569)).
-   Fix Image Block, reset image dimensions when replace URL. bug mentioned in ([#26333](https://github.com/WordPress/gutenberg/issues/26333)).

### Enhancement

-   File Block: Copy url button is moved to Block toolbar.

## 2.23.0 (2020-09-03)

### Enhancement

-   Site title is now a link.

### New Features

-   Add heading level controls to Site Title block.

## 2.12.0 (2020-01-13)

### Bug Fixes

-   Fixes a regression published in version 2.9.2 that would prevent some build tools from including
    styles provided in the packages build-styles directory.

## 2.7.0 (2019-08-05)

### Enhancements

-   Heading block uses `has-text-align-*` class names rather than inline style for text alignment.
-   Verse block uses `has-text-align-*` class names rather than inline style for text alignment.

### Bug Fixes

-   Fixed insertion of columns in the table block, which now inserts columns for all table sections ([#16410](https://github.com/WordPress/gutenberg/pull/16410))

## 2.6.0 (2019-06-12)

-   Fixed an issue with creating upgraded embed blocks that are not registered ([#15883](https://github.com/WordPress/gutenberg/issues/15883)).

## 2.5.0 (2019-05-21)

-   Add vertical alignment controls to Columns Block ([#13899](https://github.com/WordPress/gutenberg/pull/13899/)).
-   Add vertical alignment controls to Media & Text Block ([#13989](https://github.com/WordPress/gutenberg/pull/13989)).
-   Add `wide` and `full` alignments to Archives block ([#14533](https://github.com/WordPress/gutenberg/pull/14533)).
-   Add `wide` and `full` alignments to Categories block ([#14533](https://github.com/WordPress/gutenberg/pull/14533)).
-   Add all alignment options to RSS block ([#14533](https://github.com/WordPress/gutenberg/pull/14533)).
-   Add all alignment options to Search block ([#14533](https://github.com/WordPress/gutenberg/pull/14533)).
-   Add image fill option and focal point picker to Media & Text block ([#14445](https://github.com/WordPress/gutenberg/pull/14445)).
-   Updated the edit flow of the `image` block, updated the edit icon and unified the image editing in only one UI based on `MediaPlaceholder`

### Bug Fixes

-   fix uncaught error in `columns` block due to accessing a property on an object that might be undefined [#14605](https://github.com/WordPress/gutenberg/pull/14605)

## 2.3.0 (2019-03-06)

### New Feature

-   Add background color controls for the table block.
-   Add new `RSS` block ([#7966](https://github.com/WordPress/gutenberg/pull/7966)).
-   Add new `Search` block ([#13583](https://github.com/WordPress/gutenberg/pull/13583)).

## 2.2.12 (2019-01-03)

## 2.2.11 (2018-12-18)

## 2.2.10 (2018-12-12)

## 2.2.9 (2018-11-30)

## 2.2.8 (2018-11-30)

## 2.2.7 (2018-11-22)

## 2.2.6 (2018-11-21)

## 2.2.5 (2018-11-20)

## 2.2.4 (2018-11-15)

## 2.2.3 (2018-11-12)

### Bug Fixes

-   Add a minimum width for the audio block to fixed floated audio blocks.

## 2.2.2 (2018-11-12)

### Polish

-   Columns Block: Improve usability while editing columns.

## 2.2.1 (2018-11-09)

## 2.2.0 (2018-11-09)

### New Features

-   Gallery Block: Add screen reader support for order of images in gallery.

## 2.1.8 (2018-11-03)

### Polish

-   File Block: Create file blocks when dropping multiple files at once.

## 2.1.7 (2018-10-30)

## 2.1.6 (2018-10-30)

### Bug Fixes

-   Classic Block: Prevent theme styles from italicising the italicise button.
-   Gallery Block: Fix the "Remove Image" button appearing blank when an image is focussed.

## 2.1.5 (2018-10-29)

## 2.1.4 (2018-10-22)

### Bug Fixes

-   Video Block: Set correct media types for the poster image.

## 2.1.3 (2018-10-19)

## 2.1.2 (2018-10-18)

## 2.1.0 (2018-10-10)

### New Features

-   Include the classic block if `wp.oldEditor` is defined.
-   Include the HTML block.

## 2.0.0 (2018-09-05)

### Breaking Change

-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.

### Deprecations

-   Attribute type coercion has been deprecated. Omit the source to preserve type via serialized comment demarcation.
