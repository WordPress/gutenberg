/**
 * WordPress dependencies
 */
import { RichTextData } from '@wordpress/rich-text';

/**
 * Updates footnote numbering in rich text attributes across all blocks.
 * Only called when footnote order has changed, so always creates new
 * block references for the updated tree.
 *
 * @param {Array} blocks   The blocks array.
 * @param {Array} newOrder The new footnote order (array of IDs).
 * @return {Array} Updated blocks array with new references.
 */
export default function updateBlocksAttributesForNumbering( blocks, newOrder ) {
	function updateAttributes( attributes ) {
		if (
			! attributes ||
			Array.isArray( attributes ) ||
			typeof attributes !== 'object'
		) {
			return attributes;
		}

		let hasChanges = false;
		attributes = { ...attributes };

		for ( const key in attributes ) {
			const value = attributes[ key ];

			if ( Array.isArray( value ) ) {
				const updatedArray = value.map( updateAttributes );
				// Check if any array item changed (by reference).
				if ( updatedArray.some( ( item, i ) => item !== value[ i ] ) ) {
					attributes[ key ] = updatedArray;
					hasChanges = true;
				}
				continue;
			}

			if (
				typeof value !== 'string' &&
				! ( value instanceof RichTextData )
			) {
				continue;
			}

			const richTextValue =
				typeof value === 'string'
					? RichTextData.fromHTMLString( value )
					: new RichTextData( value );

			let hasFootnotes = false;

			richTextValue.replacements.forEach( ( replacement ) => {
				if ( replacement.type === 'core/footnote' ) {
					const id = replacement.attributes[ 'data-fn' ];
					const index = newOrder.indexOf( id );
					// If footnote ID not found in order, skip it (it was deleted).
					if ( index === -1 ) {
						return;
					}
					const expectedNumber = String( index + 1 );
					// Reconstruct innerHTML with the current data-fn ID and number.
					replacement.innerHTML = `<a href="#${ id }" id="${ id }-link">${ expectedNumber }</a>`;
					hasFootnotes = true;
				}
			} );

			if ( hasFootnotes ) {
				hasChanges = true;
				// Round-trip through HTML to ensure updated innerHTML is serialized.
				attributes[ key ] =
					typeof value === 'string'
						? RichTextData.fromHTMLString(
								richTextValue.toHTMLString()
						  ).toHTMLString()
						: new RichTextData( richTextValue );
			}
		}

		return hasChanges ? attributes : attributes;
	}

	return blocks.map( ( block ) => ( {
		...block,
		attributes: updateAttributes( block.attributes ),
		innerBlocks: block.innerBlocks
			? updateBlocksAttributesForNumbering( block.innerBlocks, newOrder )
			: [],
	} ) );
}
