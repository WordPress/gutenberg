# RichText Regression

## Must fix

- `packages/block-editor/src/store/actions.js:1261` — Only advance selection after successful removal. `removeBlock()` can no-op when `canRemoveBlocks()` is false, such as for an empty paragraph inside a `templateLock: 'all'` or `'insert'` container. The batch still selects block B, so the locked empty paragraph remains while focus unexpectedly jumps to the next block; a repeated Delete can then erase that block’s first character. Gate the selection on removal permission/success and add a locked-template regression case.
