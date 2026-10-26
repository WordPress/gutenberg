<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

- New package holding the fields WordPress core registers on the server for the Entity fields API: the default fields of every post type, derived from its supports, and the `page`, `wp_template`, `wp_template_part`, `wp_block`, `attachment`, and `root_site` field collections, with the script modules of their JavaScript parts ([#84696](https://github.com/WordPress/gutenberg/pull/84696)).

### Bug Fixes

- Register the `parent` field only for hierarchical post types supporting `page-attributes`, so non-hierarchical ones no longer show a Parent control with nothing to choose ([#PR-NUMBER](https://github.com/WordPress/gutenberg/pull/PR-NUMBER)).
