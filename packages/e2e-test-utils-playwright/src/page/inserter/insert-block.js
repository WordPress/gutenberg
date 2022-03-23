/**
 * Opens the inserter, searches for the given term, then selects the first
 * result that appears. It then waits briefly for the block list to update.
 *
 * @this {import('./').PageUtils}
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function insertBlock( searchTerm ) {
	await this.searchForBlock( searchTerm );
	const insertButton = this.page.locator(
		`button[role="option"] :text-is("${ searchTerm }")`
	);
	await insertButton.click();
	await this.focusSelectedBlock();
	// We should wait until the inserter closes and the focus moves to the content.
	await this.waitForInserterCloseAndContentFocus();
}
