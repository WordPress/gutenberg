/**
 * Internal dependencies
 */
import updateBlocksAttributesForNumbering from './update-blocks-attributes-for-numbering';

/**
 * Updates blocks with a new footnotes array and corrected numbering.
 * Sets the new footnotes on the footnotes block and updates all
 * footnote numbers in rich text across the block tree.
 *
 * @param {Array} blocks       The blocks array.
 * @param {Array} newFootnotes The reordered footnotes array.
 * @param {Array} newOrder     The new footnote ID order.
 * @return {Array} Updated blocks array.
 */
export default function updateBlocksWithFootnotes(
	blocks,
	newFootnotes,
	newOrder
) {
	// First, update numbering in all rich text attributes.
	const updatedBlocks = updateBlocksAttributesForNumbering(
		blocks,
		newOrder
	);

	// Then, update the footnotes block with the reordered footnotes array.
	function setFootnotesOnBlock( __blocks ) {
		return __blocks.map( ( block ) => {
			if ( block.name === 'core/footnotes' ) {
				return {
					...block,
					attributes: {
						...block.attributes,
						footnotes: newFootnotes,
					},
				};
			}
			return {
				...block,
				innerBlocks: block.innerBlocks
					? setFootnotesOnBlock( block.innerBlocks )
					: block.innerBlocks,
			};
		} );
	}

	return setFootnotesOnBlock( updatedBlocks );
}
