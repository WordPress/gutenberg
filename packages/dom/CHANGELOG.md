<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 3.3.0 (2022-01-27)

## 3.2.0 (2021-07-21)

## 3.1.0 (2021-05-20)

## 3.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 2.18.0 (2021-04-29)

### New Feature

-   Export type definitions.

## 2.17.0 (2021-03-17)

## 2.11.0 (2020-06-15)

### New Feature

-   Add `documentHasUncollapsedSelection` to inquire about ranges of selected text in the document, including the separately managed selections inside <input> and <textarea> elements.

## 2.10.0 (2020-05-28)

### New Feature

-   Add `documentHasTextSelection` to inquire specifically about ranges of selected text, in addition to the existing `documentHasSelection`.

## 2.1.0 (2019-03-06)

### Bug Fix

-   Update `isHorizontalEdge` to account for empty text nodes.
-   `tabbables.find` considers at most a single radio input for a given name. The checked input is given priority, falling back to the first in the tabindex-sorted set if there is no checked input.

## 2.0.8 (2019-01-03)

## 2.0.7 (2018-11-20)

## 2.0.6 (2018-11-09)

## 2.0.5 (2018-11-09)

## 2.0.4 (2018-10-19)

## 2.0.3 (2018-10-18)

## 2.0.0 (2018-09-05)

### Breaking Change

-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
