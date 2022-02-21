// This selector is written to support the current and old inserter markup
// because the performance tests need to be able to run across versions.
const INSERTER_SEARCH_SELECTOR =
	'.block-editor-inserter__search input,.block-editor-inserter__search-input,input.block-editor-inserter__search';

/**
 * Checks if the blocks inserter is open.
 *
 * @this {import('./').PageUtils}
 */
async function isGlobalInserterOpen() {
	return await this.page.evaluate( () => {
		// "Add block" selector is required to make sure performance comparison
		// doesn't fail on older branches where we still had "Add block" as label.
		return !! document.querySelector(
			'.edit-post-header [aria-label="Add block"].is-pressed,' +
				'.edit-site-header [aria-label="Add block"].is-pressed,' +
				'.edit-post-header [aria-label="Toggle block inserter"].is-pressed,' +
				'.edit-site-header [aria-label="Toggle block inserter"].is-pressed,' +
				'.edit-widgets-header [aria-label="Toggle block inserter"].is-pressed,' +
				'.edit-widgets-header [aria-label="Add block"].is-pressed'
		);
	} );
}

/**
 * Moves focus to the selected block.
 *
 * @this {import('./').PageUtils}
 */
async function focusSelectedBlock() {
	// Ideally there shouuld be a UI way to do this. (Focus the selected block)
	await this.page.evaluate( () => {
		window.wp.data
			.dispatch( 'core/block-editor' )
			.selectBlock(
				window.wp.data
					.select( 'core/block-editor' )
					.getSelectedBlockClientId(),
				0
			);
	} );
}

/**
 * Retrieves the document container by css class and checks to make sure the document's active element is within it
 */
async function waitForInserterCloseAndContentFocus() {
	await this.canvas().waitForFunction(
		() =>
			document.activeElement.closest(
				'.block-editor-block-list__layout'
			) !== null
	);
}

/**
 * Toggles the global inserter.
 *
 * @this {import('./').PageUtils}
 */
export async function toggleGlobalBlockInserter() {
	// "Add block" selector is required to make sure performance comparison
	// doesn't fail on older branches where we still had "Add block" as label.
	await this.page.click(
		'.edit-post-header [aria-label="Add block"],' +
			'.edit-site-header [aria-label="Add block"],' +
			'.edit-post-header [aria-label="Toggle block inserter"],' +
			'.edit-site-header [aria-label="Toggle block inserter"],' +
			'.edit-widgets-header [aria-label="Add block"],' +
			'.edit-widgets-header [aria-label="Toggle block inserter"]'
	);
}

/**
 * Opens the global block inserter.
 *
 * @this {import('./').PageUtils}
 */
export async function openGlobalBlockInserter() {
	if ( await isGlobalInserterOpen() ) {
		// If global inserter is already opened, reset to an initial state where
		// the default (first) tab is selected.
		const tab = this.page.locator(
			'.block-editor-inserter__tabs .components-tab-panel__tabs-item:nth-of-type(1):not(.is-active)'
		);

		if ( tab ) {
			await tab.click();
		}
	} else {
		await toggleGlobalBlockInserter();
	}
}

/**
 * Search for block in the global inserter
 *
 * @this {import('./').PageUtils}
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function searchForBlock( searchTerm ) {
	await openGlobalBlockInserter();
	await this.page.waitForSelector( INSERTER_SEARCH_SELECTOR );
	await this.page.focus( INSERTER_SEARCH_SELECTOR );
	await this.page.keyboard.press( 'Control+A' );
	await this.page.keyboard.type( searchTerm );
}

/**
 * Opens the inserter, searches for the given term, then selects the first
 * result that appears. It then waits briefly for the block list to update.
 *
 * @this {import('./').PageUtils}
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function insertBlock( searchTerm ) {
	await searchForBlock( searchTerm );
	const insertButton = this.page.locator( 'button:has-text("Blocks")' );
	await insertButton.click();
	await focusSelectedBlock();
	// We should wait until the inserter closes and the focus moves to the content.
	await waitForInserterCloseAndContentFocus();
}
