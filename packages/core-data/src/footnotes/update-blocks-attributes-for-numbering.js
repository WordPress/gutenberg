/**
 * WordPress dependencies
 */
import { RichTextData, create, toHTMLString } from '@wordpress/rich-text';

/**
 * Updates footnote numbering in rich text attributes across all blocks.
 *
 * @param {Array} blocks   The blocks array.
 * @param {Array} newOrder The new footnote order.
 * @return {Array} Updated blocks array.
 */
export default function updateBlocksAttributesForNumbering( blocks, newOrder ) {
	function updateAttributes( attributes ) {
		if (
			! attributes ||
			Array.isArray( attributes ) ||
			typeof attributes !== 'object'
		) {
			return { changed: false, attributes };
		}

		let attributesChanged = false;
		attributes = { ...attributes };

		for ( const key in attributes ) {
			const value = attributes[ key ];

			if ( Array.isArray( value ) ) {
				const result = value.map( updateAttributes );
				const arrayChanged = result.some( ( r ) => r.changed );
				if ( arrayChanged ) {
					attributesChanged = true;
					attributes[ key ] = result.map( ( r ) => r.attributes );
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
					// If footnote ID not found in order, skip it (it was deleted)
					if ( index === -1 ) {
						return;
					}
					const expectedNumber = String( index + 1 );
					const countValue = create( {
						html: replacement.innerHTML,
					} );

					// Always recalculate numbering based on current order
					// This is critical for undo scenarios where blocks are restored
					// with potentially stale numbering
					attributesChanged = true;
					countValue.text = expectedNumber;
					countValue.formats = Array.from(
						{ length: countValue.text.length },
						() => countValue.formats[ 0 ] || null
					);
					countValue.replacements = Array.from(
						{ length: countValue.text.length },
						() => countValue.replacements[ 0 ] || null
					);
					replacement.innerHTML = toHTMLString( {
						value: countValue,
					} );
					hasFootnotes = true;
				}
			} );

			// Always update rich text when footnotes are present to ensure
			// numbering is correct, especially after undo when blocks are restored
			if ( hasFootnotes ) {
				attributesChanged = true;
				// Recreate RichTextData from HTML string to ensure updated
				// replacement innerHTML is properly serialized
				const updatedRichTextValue =
					typeof value === 'string'
						? RichTextData.fromHTMLString(
								richTextValue.toHTMLString()
						  )
						: new RichTextData( richTextValue );
				attributes[ key ] =
					typeof value === 'string'
						? updatedRichTextValue.toHTMLString()
						: updatedRichTextValue;
			}
		}

		return {
			changed: attributesChanged,
			attributes: attributesChanged ? attributes : attributes,
		};
	}

	function updateBlocksAttributes( __blocks ) {
		return __blocks.map( ( block ) => {
			const attributesResult = updateAttributes( block.attributes );
			// Always create new block reference to ensure numbering updates propagate
			// even if attributes didn't change (important for undo scenarios)
			// This forces React to re-render blocks with footnotes on undo
			return {
				...block,
				attributes: attributesResult.attributes,
				innerBlocks: block.innerBlocks
					? updateBlocksAttributes( block.innerBlocks )
					: [],
			};
		} );
	}

	// Always update blocks to ensure numbering is correct, especially on undo
	// Always create new block references to force React re-render
	const newBlocks = updateBlocksAttributes( blocks );
	return newBlocks;
}
