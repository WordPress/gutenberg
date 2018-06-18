+blockListChangeListener
+========================
+
+The `blockListChangeListener` is a listener function that observes changes in the active block list from `core/data`. The function calls four actions, depending what change is happening.
+
+## Action reference
+
+- `blocks.add.blockName` - When a block with the name "blockName" is being added.
+- `blocks.remove.blockName` - When a block with the name "blockName" is being removed.
+- `blocks.transformed.from.coreParagraph` - When a block is being transformed from a block with the name "blockName".
+- `blocks.transformed.to.blockName` - When a block is being transformed to a block with the name "blockName".
+
+
+`blockName` is the camelCased version of the block name. E.g. `coreParagraph` for `core/paragraph`.
+The object of the block is being passed as an argument. 
+
+## Example 
+
+These actions can be used to check which blocks are being added and removed to act accordingly. 
+```js
+/**
+ * An action listener, which fires the deletion of the metadata
+ * once the remove action is seen.
+ */
+addAction('blocks.removed.someBlock', 'someBlock/someAction', ( block ) => {
+	let currentPostMeta = select( 'core/editor' ).getEditedPostAttribute( 'meta' );
+	currentPostMeta.abitraryMeta = '';
+	dispatch( 'core/editor' ).editPost( { meta: currentPostMeta } );
+});
+```
