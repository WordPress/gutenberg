/**
 * Returns an array with all blocks; Equivalent to calling wp.data.select( 'core/block-editor' ).getBlocks();
 *
 * @return {Promise} Promise resolving with an array containing all blocks in the document.
 */
export async function getAllBlocks() {
	return page.evaluate( () => {
		const blocks = window.wp.data.select( 'core/block-editor' ).getBlocks();
		/**
		 * We are turning the result into a JSON object and back, to turn all the non-serializable
		 * values into `null`.
		 *
		 * `page.evaluate` returns `undefined` if it encounters a non-serializable value.
		 * To avoid returning `undefined`, we turn the result into a JSON string and back,
		 * which results in a serializable value every time.
		 *
		 * For more information see: https://github.com/WordPress/gutenberg/pull/31199
		 */
		return JSON.parse( JSON.stringify( blocks ) );
	} );
}
