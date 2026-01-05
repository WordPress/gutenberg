/**
 * Internal dependencies
 */
import findFootnotesBlock from './find-footnotes-block';
import getFootnotesOrder from './get-footnotes-order';
import updateBlocksAttributesForNumbering from './update-blocks-attributes-for-numbering';
import updateBlocksWithFootnotes from './update-blocks-with-footnotes';

/**
 * Updates footnotes from block attributes (new approach).
 * Handles order changes and updates footnote numbering in rich text.
 *
 * @param {Array} blocks The blocks array.
 * @return {Object} Object with updated blocks.
 */
export default function updateFootnotesFromBlockAttributes( blocks ) {
	// Find footnotes block
	const footnotesBlock = findFootnotesBlock( blocks );

	if ( ! footnotesBlock?.attributes?.footnotes ) {
		return { blocks };
	}

	const newOrder = getFootnotesOrder( blocks );

	const footnotes = footnotesBlock.attributes.footnotes;
	const currentOrder = footnotes.map( ( fn ) => fn.id );

	// Always update numbering in rich text, even if order hasn't changed
	// This ensures numbering is recalculated on undo when blocks are restored
	// with potentially stale numbering
	let updatedBlocks = updateBlocksAttributesForNumbering( blocks, newOrder );

	// Update footnotes block to force re-render when numbering changes
	// This ensures the canvas updates with correct numbering after undo
	function updateFootnotesBlockVersion( __blocks ) {
		return __blocks.map( ( block ) => {
			if ( block.name === 'core/footnotes' ) {
				return {
					...block,
					attributes: {
						...block.attributes,
						// Increment version to force re-render
						__footnotesVersion:
							( block.attributes.__footnotesVersion || 0 ) + 1,
					},
					innerBlocks: updateFootnotesBlockVersion(
						block.innerBlocks
					),
				};
			}
			return {
				...block,
				innerBlocks: updateFootnotesBlockVersion( block.innerBlocks ),
			};
		} );
	}

	// If order hasn't changed, return blocks with updated numbering and version
	if ( currentOrder.join( '' ) === newOrder.join( '' ) ) {
		updatedBlocks = updateFootnotesBlockVersion( updatedBlocks );
		return { blocks: updatedBlocks };
	}

	// Order changed - reorder footnotes array
	const newFootnotes = newOrder.map( ( fnId ) => {
		const existingFootnote = footnotes.find( ( fn ) => fn.id === fnId );
		if ( existingFootnote ) {
			return existingFootnote;
		}
		// Footnote not found in block attributes - create empty one
		return {
			id: fnId,
			content: '',
		};
	} );

	// Update blocks: reorder footnotes array and update numbering
	updatedBlocks = updateBlocksWithFootnotes(
		updatedBlocks,
		newFootnotes,
		newOrder
	);

	return { blocks: updatedBlocks };
}
