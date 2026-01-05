/**
 * Finds the footnotes block in a blocks array.
 *
 * @param {Array} blocks The blocks array to search.
 * @return {Object|null} The footnotes block, or null if not found.
 */
export default function findFootnotesBlock( blocks ) {
	for ( const block of blocks ) {
		if ( block.name === 'core/footnotes' ) {
			return block;
		}
		if ( block.innerBlocks ) {
			const found = findFootnotesBlock( block.innerBlocks );
			if ( found ) {
				return found;
			}
		}
	}
	return null;
}
