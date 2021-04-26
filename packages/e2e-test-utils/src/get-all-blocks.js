/**
 * Returns an array with all blocks; Equivalent to calling wp.data.select( 'core/block-editor' ).getBlocks();
 *
 * @param {Function} evaluate test
 * @return {Promise} Promise resolving with an array containing all blocks in the document.
 */
export async function getAllBlocks( evaluate ) {
	const allBlocks = await page.evaluate( ( _evaluate ) => {
		const blocks = wp.data.select( 'core/block-editor' ).getBlocks();

		return _evaluate( blocks );
	}, evaluate );
	return allBlocks;
}
