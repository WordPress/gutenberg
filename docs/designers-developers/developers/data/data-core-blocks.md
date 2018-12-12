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

### getBlockStyles

Returns block styles by block name.

*Parameters*

 * state: Data state.
 * name: Block type name.

*Returns*

Block Styles.

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

### getFreeformFallbackBlockName

Returns the name of the block for handling non-block content.

*Parameters*

 * state: Data state.

*Returns*

Name of the block for handling non-block content.

### getUnregisteredFallbackBlockName

Returns the name of the block for handling unregistered blocks.

*Parameters*

 * state: Data state.

*Returns*

Name of the block for handling unregistered blocks.

### getChildBlockNames

Returns an array with the child blocks of a given block.

*Parameters*

 * state: Data state.
 * blockName: Block type name.

*Returns*

Array of child block names.

### getBlockSupport

Returns the block support value for a feature, if defined.

*Parameters*

 * state: Data state.
 * nameOrType: Block name or type object
 * feature: Feature to retrieve
 * defaultSupports: Default value to return if not
                                          explicitly defined

*Returns*

Block support value

### hasBlockSupport

Returns true if the block defines support for a feature, or false otherwise.

*Parameters*

 * state: Data state.
 * nameOrType: Block name or type object.
 * feature: Feature to test.
 * defaultSupports: Whether feature is supported by
                                         default if not explicitly defined.

*Returns*

Whether block supports feature.

### hasChildBlocks

Returns a boolean indicating if a block has child blocks or not.

*Parameters*

 * state: Data state.
 * blockName: Block type name.

*Returns*

True if a block contains child blocks and false otherwise.

### hasChildBlocksWithInserterSupport

Returns a boolean indicating if a block has at least one child block with inserter support.

*Parameters*

 * state: Data state.
 * blockName: Block type name.

*Returns*

True if a block contains at least one child blocks with inserter support
                  and false otherwise.

## Actions

### addBlockTypes

Returns an action object used in signalling that block types have been added.

*Parameters*

 * blockTypes: Block types received.

### removeBlockTypes

Returns an action object used to remove a registered block type.

*Parameters*

 * names: Block name.

### addBlockStyles

Returns an action object used in signalling that new block styles have been added.

*Parameters*

 * blockName: Block name.
 * styles: Block styles.

### removeBlockStyles

Returns an action object used in signalling that block styles have been removed.

*Parameters*

 * blockName: Block name.
 * styleNames: Block style names.

### setDefaultBlockName

Returns an action object used to set the default block name.

*Parameters*

 * name: Block name.

### setFreeformFallbackBlockName

Returns an action object used to set the name of the block used as a fallback
for non-block content.

*Parameters*

 * name: Block name.

### setUnregisteredFallbackBlockName

Returns an action object used to set the name of the block used as a fallback
for unregistered blocks.

*Parameters*

 * name: Block name.

### setCategories

Returns an action object used to set block categories.

*Parameters*

 * categories: Block categories.

### updateCategory

Returns an action object used to update a category.

*Parameters*

 * slug: Block category slug.
 * category: Object containing the category properties that should be updated.