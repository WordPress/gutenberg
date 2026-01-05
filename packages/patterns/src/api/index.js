/**
 * Determines whether a block is overridable.
 *
 * @param {WPBlock}                            block           The block to test.
 * @param {Record<string, string[]>|undefined} supportedBlocks Map of block names to their supported attributes for pattern overrides.
 *
 * @return {boolean} `true` if a block is overridable, `false` otherwise.
 */
export function isOverridableBlock( block, supportedBlocks ) {
	return (
		!! supportedBlocks?.[ block.name ]?.length &&
		!! block.attributes.metadata?.name &&
		!! block.attributes.metadata?.bindings &&
		Object.values( block.attributes.metadata.bindings ).some(
			( binding ) => binding.source === 'core/pattern-overrides'
		)
	);
}

/**
 * Determines whether the blocks list has overridable blocks.
 *
 * @param {WPBlock[]}                          blocks          The blocks list.
 * @param {Record<string, string[]>|undefined} supportedBlocks Map of block names to their supported attributes for pattern overrides.
 *
 * @return {boolean} `true` if the list has overridable blocks, `false` otherwise.
 */
export function hasOverridableBlocks( blocks, supportedBlocks ) {
	return blocks.some( ( block ) => {
		if ( isOverridableBlock( block, supportedBlocks ) ) {
			return true;
		}
		return hasOverridableBlocks( block.innerBlocks, supportedBlocks );
	} );
}
