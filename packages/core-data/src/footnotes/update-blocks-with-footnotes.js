/**
 * Internal dependencies
 */
import updateBlocksAttributesForNumbering from './update-blocks-attributes-for-numbering';

/**
 * Updates blocks with new footnotes array and numbering.
 *
 * @param {Array} blocks       The blocks array.
 * @param {Array} newFootnotes The new footnotes array.
 * @param {Array} newOrder     The new footnote order.
 * @return {Array} Updated blocks array.
 */
export default function updateBlocksWithFootnotes(
	blocks,
	newFootnotes,
	newOrder
) {
	const updatedBlocks = updateBlocksAttributesForNumbering(
		blocks,
		newOrder
	);

	// Update footnotes block with new footnotes array
	// Add a version number to force re-render when numbering changes
	function updateFootnotesBlock( __blocks ) {
		return __blocks.map( ( block ) => {
			if ( block.name === 'core/footnotes' ) {
				return {
					...block,
					attributes: {
						...block.attributes,
						footnotes: newFootnotes,
						// Add version to force re-render when numbering updates
						__footnotesVersion:
							( block.attributes.__footnotesVersion || 0 ) + 1,
					},
					innerBlocks: updateFootnotesBlock( block.innerBlocks ),
				};
			}
			return {
				...block,
				innerBlocks: updateFootnotesBlock( block.innerBlocks ),
			};
		} );
	}

	return updateFootnotesBlock( updatedBlocks );
}
