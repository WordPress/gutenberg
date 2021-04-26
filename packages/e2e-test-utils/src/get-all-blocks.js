let nextFunctionId = 1;

/**
 * Returns an array with all blocks; Equivalent to calling wp.data.select( 'core/block-editor' ).getBlocks();
 *
 * @param {Function} evaluate test
 * @return {Promise} Promise resolving with an array containing all blocks in the document.
 */
export async function getAllBlocks( evaluate ) {
	const functionName = `_getAllBlocks_evaluate_${ nextFunctionId++ }`;
	await page.exposeFunction( functionName, evaluate );

	const allBlocks = await page.evaluate( ( _functionName ) => {
		const blocks = wp.data.select( 'core/block-editor' ).getBlocks();
		return window[ _functionName ]( blocks );
	}, functionName );

	return allBlocks;
}
