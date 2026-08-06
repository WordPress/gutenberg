/**
 * WordPress dependencies
 */
import { getBlockAttributesNamesByRole } from '@wordpress/blocks';

/**
 * Returns the attributes a newly created block inherits from an adjacent
 * block of the same type: everything except the adjacent block's content
 * (attributes with the `content` role, including the block's metadata)
 * and the anchor, a document-unique id.
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

	const excluded = new Set(
		getBlockAttributesNamesByRole( blockName, 'content' )
	);
	// The anchor cannot carry the `content` role: `isContentBlock` reads any
	// content role attribute as "editable under content locking", which the
	// anchor must not trigger. It still must not be duplicated onto a
	// sibling, as it is a document-unique id.
	excluded.add( 'anchor' );
	return Object.fromEntries(
		Object.entries( attributes ).filter(
			( [ key ] ) => ! excluded.has( key )
		)
	);
}
