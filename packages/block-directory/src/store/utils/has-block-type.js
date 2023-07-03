/**
 * Check if a block list contains a specific block type. Recursively searches
 * through `innerBlocks` if they exist.
 *
 * @param {Object}   blockType A block object to search for.
 * @param {Object[]} blocks    The list of blocks to look through.
 *
 * @return {boolean} Whether the blockType is found.
 */
export default function hasBlockType( blockType, blocks = [] ) {
	if ( ! blocks.length ) {
		return false;
	}
	if ( blocks.some( ( { name } ) => name === blockType.name ) ) {
		return true;
	}
	for ( let i = 0; i < blocks.length; i++ ) {
		if ( hasBlockType( blockType, blocks[ i ].innerBlocks ) ) {
			return true;
		}
	}

	return false;
}
