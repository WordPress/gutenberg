import { getBlockAttributesNamesByRole } from '@wordpress/blocks';

/**
 * Returns the attributes a newly created block inherits from an adjacent
 * block of the same type: everything except the adjacent block's content
 * (attributes with the `content` role) and its metadata.
 * A styled sibling thus yields an equally styled, empty new block.
 *
 * @param blockName  The block name.
 * @param attributes The adjacent block's attributes.
 *
 * @return The attributes for the new block.
 */
export function getSiblingBlockAttributes(
	blockName: string,
	attributes?: Record< string, unknown > | null
): Record< string, unknown > {
	if ( ! attributes ) {
		return {};
	}

	const excluded = new Set(
		getBlockAttributesNamesByRole( blockName, 'content' )
	);
	// The metadata attribute has no declared definition to carry a role. Its
	// contents (bindings, custom name, bookkeeping) must not be duplicated.
	excluded.add( 'metadata' );
	return Object.fromEntries(
		Object.entries( attributes ).filter(
			( [ key ] ) => ! excluded.has( key )
		)
	);
}
