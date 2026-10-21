<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

Initial release ([#84643](https://github.com/WordPress/gutenberg/pull/84643)).

### New Features

-   Add the `page` collection, with the "Set as homepage" and "Set as posts page" actions moved from `@wordpress/editor`. They apply to the pages with the `wp:action-set-homepage` or `wp:action-set-posts-page` REST link ([#84932](https://github.com/WordPress/gutenberg/pull/84932)).
-   Add the "Edit" action of pages, templates, template parts, and patterns to the `post_type_supports` collection, moved from `@wordpress/edit-site`. It opens the entity with the entity navigator the screen sets in the editor store.
-   Add the "Quick edit" action of pages to the `page` collection, moved from `@wordpress/edit-site` and the extensible site editor. It opens the quick edit form of the pages with the opener the screen sets in the editor store.
