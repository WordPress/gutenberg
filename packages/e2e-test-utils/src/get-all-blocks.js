/**
 * Returns an array with all blocks; Equivalent to calling wp.data.select( 'core/editor' ).getBlocks();
 *
 * @return {Promise} Promise resolving with an array containing all blocks in the document.
 */
export async function getAllBlocks() {
	return await page.evaluate( () => {
		const { select } = window.wp.data;
		return select( 'core/editor' ).getBlocks();
	} );
}
