<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

- New package holding the fields WordPress core registers on the server for the Entity fields API: the default fields of every post type, derived from its supports, and the `page`, `wp_template`, `wp_template_part`, `wp_block`, `attachment`, and `root_site` field collections, with the script modules of their JavaScript parts ([#84696](https://github.com/WordPress/gutenberg/pull/84696)).

### Enhancements

- Template field: Disable the field for the front page and the posts page, whose template comes from the reading settings ([#87541](https://github.com/WordPress/gutenberg/pull/87541)).
- Author fields: Show initials when the author's profile image is unavailable ([#85208](https://github.com/WordPress/gutenberg/pull/85208)).

### Bug Fixes

- Only register the parent field for hierarchical post types supporting page attributes ([#85679](https://github.com/WordPress/gutenberg/pull/85679)).
- Show the parent field's control for hierarchical post types that are not publicly viewable, instead of an empty popover ([#85679](https://github.com/WordPress/gutenberg/pull/85679)).
