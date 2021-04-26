/**
 * Returns an array with all blocks; Equivalent to calling wp.data.select( 'core/block-editor' ).getBlocks();
 *
 * @return {Promise} Promise resolving with an array containing all blocks in the document.
 */
export async function getAllBlocks() {
	const allBlocks = await page.evaluate( () => {
		const blocks = wp.data.select( 'core/block-editor' ).getBlocks();

		const blocksCopy = blocks.map( ( block ) => ( { ...block } ) );
		const queue = [ ...blocksCopy ];
		while ( queue.length > 0 ) {
			const block = queue.shift();

			delete block.validationIssues;

			if ( block.innerBlocks?.length > 0 ) {
				block.innerBlocks = block.innerBlocks.map( ( innerBlock ) => ( {
					...innerBlock,
				} ) );
				for ( const innerBlock of block.innerBlocks ) {
					queue.push( innerBlock );
				}
			}
		}
	} );

	if ( typeof allBlocks === 'undefined' ) {
		const listener = ( message ) => {
			// eslint-disable-next-line no-console
			console.log( message.text() );
		};
		page.on( 'console', listener );
		await page.evaluate( () => {
			const _allBlocks = wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			// eslint-disable-next-line no-console
			console.log( _allBlocks, JSON.stringify( _allBlocks ) );
		} );
		page.off( 'console', listener );
	}
	return allBlocks;
}
