/**
 * Internal dependencies
 */
import findFootnotesBlock from './find-footnotes-block';
import getFootnotesOrder from './get-footnotes-order';
import updateBlocksWithFootnotes from './update-blocks-with-footnotes';

/**
 * Updates footnotes from block attributes (new storage approach).
 * Compares the footnote order in the block tree with the order stored
 * in the footnotes block's attributes. When order differs, reorders
 * the footnotes array and updates numbering in all rich text.
 *
 * Short-circuits when order hasn't changed to avoid unnecessary work.
 *
 * @param {Array} blocks The blocks array.
 * @return {Object} Object with `blocks` (updated or original reference).
 */
export default function updateFootnotesFromBlockAttributes( blocks ) {
	const footnotesBlock = findFootnotesBlock( blocks );

	if ( ! footnotesBlock?.attributes?.footnotes ) {
		return { blocks };
	}

	const footnotes = footnotesBlock.attributes.footnotes;
	const currentOrder = footnotes.map( ( fn ) => fn.id );
	const newOrder = getFootnotesOrder( blocks );

	// Short-circuit: if order hasn't changed, return input blocks unchanged.
	// This avoids a full tree traversal on every keystroke.
	if ( currentOrder.join( '' ) === newOrder.join( '' ) ) {
		return { blocks };
	}

	// Order changed: reorder the footnotes array to match document order.
	const newFootnotes = newOrder.map( ( fnId ) => {
		const existing = footnotes.find( ( fn ) => fn.id === fnId );
		return existing || { id: fnId, content: '' };
	} );

	// Update numbering in all blocks and set the new footnotes array.
	const updatedBlocks = updateBlocksWithFootnotes(
		blocks,
		newFootnotes,
		newOrder
	);

	return { blocks: updatedBlocks };
}
