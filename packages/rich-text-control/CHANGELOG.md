<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

Initial release. `RichTextControl` is a standalone form control extracted from `@wordpress/block-editor` so consumers (e.g. `@wordpress/fields`) can render a rich text input without pulling the block-editor module graph.

### New Features

-   Add a `completers` prop to wire autocompleters (e.g. an `@` mention completer) to the field.
