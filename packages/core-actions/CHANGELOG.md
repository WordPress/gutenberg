<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

Initial release ([#84643](https://github.com/WordPress/gutenberg/pull/84643)).

### New Features

-   Add the `page` collection, with the "Set as homepage" and "Set as posts page" actions moved from `@wordpress/editor`. They apply to the pages with the `wp:action-set-homepage` or `wp:action-set-posts-page` REST link ([#84932](https://github.com/WordPress/gutenberg/pull/84932)).
-   Add the "Edit" action (`edit-post`) of the lists of pages, templates, template parts, and patterns, moved from `@wordpress/edit-site`: it calls `onActionPerformed` instead of navigating, so the screen listing it opens the editor.
-   Add the "Quick edit" action (`quick-edit`) of the list of pages, moved from `@wordpress/edit-site`: it calls `onActionPerformed` instead of navigating, so the screen listing it opens the quick edit form.
