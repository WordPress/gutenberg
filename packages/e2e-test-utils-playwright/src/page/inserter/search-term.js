const INSERTER_SEARCH_SELECTOR =
	'.block-editor-inserter__search input,.block-editor-inserter__search-input,input.block-editor-inserter__search';

/**
 * Search for block in the global inserter
 *
 * @this {import('./').PageUtils}
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function searchForBlock( searchTerm ) {
	await this.openGlobalBlockInserter();
	await this.page.waitForSelector( INSERTER_SEARCH_SELECTOR );
	await this.page.focus( INSERTER_SEARCH_SELECTOR );
	await this.page.keyboard.press( 'Control+A' );
	await this.page.keyboard.type( searchTerm );
}
