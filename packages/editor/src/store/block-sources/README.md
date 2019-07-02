Block Sources
=============

By default, the blocks module supports only attributes serialized into a block's comment demarcations, or those sourced from a [standard set of sources](https://developer.wordpress.org/block-editor/developers/block-api/block-attributes/). Since the blocks module is intended to be used in a number of contexts outside the post editor, the implementation of additional context-specific sources must be implemented as an external process.

The post editor supports such additional sources for attributes (e.g. `meta` source).

These sources are implemented here using a uniform interface for applying and responding to block updates to sourced attributes. In the future, this interface may be generalized to allow third-party extensions to either extend the post editor sources or implement their own in custom renderings of a block editor.

## Source API

### `apply`

Store control called when the editor blocks value is changed. Given a block object, returns a new block with the sourced attribute value assigned.

### `applyAll`

Store control called when the editor blocks value is changed. Given an array of blocks, modifies block entries which source from a sourced property, responsible for returning a new block array with attribute values assigned.

### `update`

Store control called when a single block's attributes have been updated, before the new block value has taken effect (i.e. before `apply` and `applyAll` are once again called). Given the attribute schema and updated value, the control should reflect the update on the source.
