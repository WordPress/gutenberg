/**
 * Returns an array with all blocks; Equivalent to calling wp.data.select( 'core/block-editor' ).getBlocks();
 *
 * @param {Function} evaluate test
 * @return {Promise} Promise resolving with an array containing all blocks in the document.
 */
export async function getAllBlocks( evaluate ) {
	await page.exposeFunction( '_getAllBlocks_evaluate', evaluate );
	const allBlocks = await page.evaluate( () => {
		const blocks = wp.data.select( 'core/block-editor' ).getBlocks();
		return window._getAllBlocks_evaluate( blocks );
	} );
	return allBlocks;
}
