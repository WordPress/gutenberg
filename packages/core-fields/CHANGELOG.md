<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

- `wp_template`: New `template` field, the template a template is rendered inside, so that a header and a footer live in one template instead of being repeated in every one ([#85385](https://github.com/WordPress/gutenberg/pull/85402)).
- New package holding the fields WordPress core registers on the server for the Entity fields API: the default fields of every post type, derived from its supports, and the `page`, `wp_template`, `wp_template_part`, `wp_block`, `attachment`, and `root_site` field collections, with the script modules of their JavaScript parts ([#84696](https://github.com/WordPress/gutenberg/pull/84696)).
