/**
 * WordPress dependencies
 */
import { getBlockAttributesNamesByRole } from '@wordpress/blocks';

/**
 * Attributes that must stay unique to a block and are never inherited by a
 * new sibling. `metadata` also carries the block's bindings and custom name.
 */
const UNIQUE_ATTRIBUTES = [ 'anchor', 'metadata' ];

/**
 * Returns the attributes a newly created block inherits from an adjacent
 * block of the same type: everything except the adjacent block's content
 * (attributes with the `content` role) and attributes that must stay unique.
 * A styled sibling thus yields an equally styled, empty new block.
 *
 * @param {string}  blockName  The block name.
 * @param {?Object} attributes The adjacent block's attributes.
 *
 * @return {Object} The attributes for the new block.
 */
export function getSiblingBlockAttributes( blockName, attributes ) {
	if ( ! attributes ) {
		return {};
	}

	const excluded = new Set( [
		...getBlockAttributesNamesByRole( blockName, 'content' ),
		...UNIQUE_ATTRIBUTES,
	] );
	return Object.fromEntries(
		Object.entries( attributes ).filter(
			( [ key ] ) => ! excluded.has( key )
		)
	);
}
