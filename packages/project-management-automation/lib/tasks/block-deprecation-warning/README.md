Block Deprecation Warning
===

Adds a comment to a pull request which contains edits to a block implementation `save.js` file if there is no corresponding revisions to the block's `deprecated.js`.

## Rationale

When the generated markup of a block has changed, there is a high likelihood that a deprecated migration should be provided. Otherwise, there is a risk that user content may either be destroyed or marked as invalid.

The core block library source files are set up in such a way that the source folder of an individual block should contain separate `save.js` and `deprecated.js` files. If a pull request includes a revision to `save.js`, it's typically expected there should be corresponding revisions to the relative `deprecated.js`.

## Relevant Resources

- [Block Editor Handbook: Deprecated Blocks](https://developer.wordpress.org/block-editor/developers/block-api/block-deprecation/)
- [Block Editor Handbook: Edit and Save: Validation](https://developer.wordpress.org/block-editor/developers/block-api/block-edit-save/#validation)
