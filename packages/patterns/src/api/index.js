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
		if ( isOverridableBlock( block ) ) return true;
		return hasOverridableBlocks( block.innerBlocks );
	} );
}

/**
 * Get the overridable attributes for the give block.
 *
 * @param {WPBlock} block The block to test.
 *
 * @return {string[]} The attribute names in an array.
 */
export function getOverridableAttributes( block ) {
	const set = new Set();
	// get default attributes for the block.
	if ( block.attributes.metadata.bindings.__default ) {
		PARTIAL_SYNCING_SUPPORTED_BLOCKS[ block.name ].forEach(
			( attribute ) => {
				set.add( attribute );
			}
		);
	}
	// Any additional attributes and overrides.
	for ( const [ attributeKey, binding ] of Object.entries(
		block.attributes.metadata.bindings
	) ) {
		if ( attributeKey === '__default' ) continue;
		if ( binding.source === 'core/pattern-overrides' ) {
			set.add( attributeKey );
		} else {
			set.delete( attributeKey );
		}
	}
	return Array.from( set );
}
