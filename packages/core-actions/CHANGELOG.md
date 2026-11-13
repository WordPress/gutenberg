<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

Initial release ([#84643](https://github.com/WordPress/gutenberg/pull/84643)).

### Breaking Changes

-   Registered action labels no longer include ellipses. DataViews and the editor add translated ellipses when displaying modal actions in menus ([#85396](https://github.com/WordPress/gutenberg/pull/85396)).

### New Features

-   Add the `page` collection, with the "Set as homepage" and "Set as posts page" actions moved from `@wordpress/editor`. They apply to the pages with the `wp:action-set-homepage` or `wp:action-set-posts-page` REST link ([#84932](https://github.com/WordPress/gutenberg/pull/84932)).
