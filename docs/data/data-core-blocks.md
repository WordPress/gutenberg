# **core/blocks**: Block Types Data

## Selectors

### getBlockTypes

Returns all the available block types.

*Parameters*

 * state: Data state.

### getBlockType

Returns a block type by name.

*Parameters*

 * state: Data state.
 * name: Block type name.

*Returns*

Block Type.

### getCategories

Returns all the available categories.

*Parameters*

 * state: Data state.

*Returns*

Categories list.

### getDefaultBlockName

Returns the name of the default block name.

*Parameters*

 * state: Data state.

*Returns*

Default block name.

### getFallbackBlockName

Returns the name of the fallback block name.

*Parameters*

 * state: Data state.

*Returns*

Fallback block name.

### getChildBlockNames

Returns an array with the child blocks of a given block.

*Parameters*

 * state: Data state.
 * blockName: Block type name.

*Returns*

Array of child block names.

### hasChildBlocks

Returns a boolean indicating if a block has child blocks or not.

*Parameters*

 * state: Data state.
 * blockName: Block type name.

*Returns*

True if a block contains child blocks and false otherwise.

## Actions

### addBlockTypes

Returns an action object used in signalling that block types have been added.

*Parameters*

 * blockTypes: Block types received.

### removeBlockTypes

Returns an action object used to remove a registered block type.

*Parameters*

 * names: Block name.

### setDefaultBlockName

Returns an action object used to set the default block name.

*Parameters*

 * name: Block name.

### setFallbackBlockName

Returns an action object used to set the fallback block name.

*Parameters*

 * name: Block name.

### setCategories

Returns an action object used to set block categories.

*Parameters*

 * categories: Block categories.