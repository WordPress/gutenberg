/**
 * Internal dependencies
 */
import { PARTIAL_SYNCING_SUPPORTED_BLOCKS } from '../constants';

/**
 * Determines whether a block is overridable.
 *
 * @param {WPBlock} block The block to test.
 *
 * @return {boolean} `true` if a block is overridable, `false` otherwise.
 */
export function isOverridableBlock( block ) {
	return (
		Object.keys( PARTIAL_SYNCING_SUPPORTED_BLOCKS ).includes(
			block.name
		) &&
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
 * @param {WPBlock[]} blocks The blocks list.
 *
 * @return {boolean} `true` if the list has overridable blocks, `false` otherwise.
 */
export function hasOverridableBlocks( blocks ) {
	return blocks.some( ( block ) => {
		if ( isOverridableBlock( block ) ) {
			return true;
		}
		return hasOverridableBlocks( block.innerBlocks );
	} );
}
