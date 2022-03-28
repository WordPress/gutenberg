/**
 * Opens the inserter, searches for the given term, then selects the first
 * result that appears. It then waits briefly for the block list to update.
 *
 * @this {import('./').PageUtils}
 * @param {string} blockName The name of the block to insert.
 */
export async function insertBlock( blockName ) {
	await this.page.evaluate( ( name ) => {
		window.wp.data
			.dispatch( 'core/block-editor' )
			.insertBlock( window.wp.blocks.createBlock( name ) );
	}, blockName );

	await this.focusSelectedBlock();
	// We should wait until the inserter closes and the focus moves to the content.
	await this.waitForInserterCloseAndContentFocus();
}
