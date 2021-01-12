/**
 * Internal dependencies
 */
import { pressKeyWithModifier } from './press-key-with-modifier';
import { canvas } from './canvas';

// This selector is written to support the current and old inserter markup
// because the performance tests need to be able to run across versions.
const INSERTER_SEARCH_SELECTOR =
	'.block-editor-inserter__search-input,input.block-editor-inserter__search';

/**
 * Opens the global block inserter.
 */
export async function openGlobalBlockInserter() {
	if ( await isGlobalInserterOpen() ) {
		// If global inserter is already opened, reset to an initial state where
		// the default (first) tab is selected.
		const tab = await page.$(
			'.block-editor-inserter__tabs .components-tab-panel__tabs-item:nth-of-type(1):not(.is-active)'
		);

		if ( tab ) {
			await tab.click();
		}
	} else {
		await toggleGlobalBlockInserter();

		// Waiting here is necessary because sometimes the inserter takes more time to
		// render than Puppeteer takes to complete the 'click' action
		await page.waitForSelector( '.block-editor-inserter__menu' );
	}
}

export async function closeGlobalBlockInserter() {
	if ( await isGlobalInserterOpen() ) {
		await toggleGlobalBlockInserter();
	}
}

async function isGlobalInserterOpen() {
	return await page.evaluate( () => {
		return !! document.querySelector(
			'.edit-post-header [aria-label="Add block"].is-pressed, .edit-site-header [aria-label="Add block"].is-pressed'
		);
	} );
}
/**
 * Toggles the global inserter.
 */
export async function toggleGlobalBlockInserter() {
	await page.click(
		'.edit-post-header [aria-label="Add block"], .edit-site-header [aria-label="Add block"]'
	);
}

/**
 * Retrieves the document container by css class and checks to make sure the document's active element is within it
 */
async function waitForInserterCloseAndContentFocus() {
	await canvas().waitForFunction(
		() =>
			document.activeElement.closest(
				'.block-editor-block-list__layout'
			) !== null
	);
}

/**
 * Search for block in the global inserter
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function searchForBlock( searchTerm ) {
	await openGlobalBlockInserter();
	await page.waitForSelector( INSERTER_SEARCH_SELECTOR );
	await page.focus( INSERTER_SEARCH_SELECTOR );
	await pressKeyWithModifier( 'primary', 'a' );
	await page.keyboard.type( searchTerm );
}

/**
 * Search for pattern in the global inserter
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function searchForPattern( searchTerm ) {
	await openGlobalBlockInserter();
	// Select the patterns tab
	const tab = await page.waitForXPath(
		'//div[contains(@class, "block-editor-inserter__tabs")]//button[.="Patterns"]'
	);
	await tab.click();
	await page.waitForSelector( INSERTER_SEARCH_SELECTOR );
	await page.focus( INSERTER_SEARCH_SELECTOR );
	await pressKeyWithModifier( 'primary', 'a' );
	await page.keyboard.type( searchTerm );
}

/**
 * Search for reusable block in the global inserter.
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function searchForReusableBlock( searchTerm ) {
	await openGlobalBlockInserter();

	// The reusable blocks tab won't appear until the reusable blocks have been
	// fetched. They aren't fetched until an inserter is used or the post
	// already contains reusable blocks, so wait for the tab to appear.
	await page.waitForXPath(
		'//div[contains(@class, "block-editor-inserter__tabs")]//button[text()="Reusable"]'
	);

	// Select the reusable blocks tab.
	const tab = await page.waitForXPath(
		'//div[contains(@class, "block-editor-inserter__tabs")]//button[text()="Reusable"]'
	);
	await tab.click();
	await page.waitForSelector( INSERTER_SEARCH_SELECTOR );
	await page.focus( INSERTER_SEARCH_SELECTOR );
	await pressKeyWithModifier( 'primary', 'a' );
	await page.keyboard.type( searchTerm );
}

/**
 * Opens the inserter, searches for the given term, then selects the first
 * result that appears. It then waits briefly for the block list to update.
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function insertBlock( searchTerm ) {
	await searchForBlock( searchTerm );
	const insertButton = await page.waitForXPath(
		`//button//span[contains(text(), '${ searchTerm }')]`
	);
	await insertButton.click();
	// We should wait until the inserter closes and the focus moves to the content.
	await waitForInserterCloseAndContentFocus();
}

/**
 * Opens the inserter, searches for the given pattern, then selects the first
 * result that appears. It then waits briefly for the block list to update.
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function insertPattern( searchTerm ) {
	await searchForPattern( searchTerm );
	const insertButton = await page.waitForXPath(
		`//div[@role = 'button']//div[contains(text(), '${ searchTerm }')]`
	);
	await insertButton.click();
	// We should wait until the inserter closes and the focus moves to the content.
	await waitForInserterCloseAndContentFocus();
}

/**
 * Opens the inserter, searches for the given reusable block, then selects the
 * first result that appears. It then waits briefly for the block list to
 * update.
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function insertReusableBlock( searchTerm ) {
	await searchForReusableBlock( searchTerm );
	const insertButton = await page.waitForXPath(
		`//button//span[contains(text(), '${ searchTerm }')]`
	);
	await insertButton.click();
	// We should wait until the inserter closes and the focus moves to the content.
	await waitForInserterCloseAndContentFocus();
	// We should wait until the block is loaded
	await page.waitForXPath(
		'//*[@class="block-library-block__reusable-block-container"]'
	);
}

/**
 * Opens the inserter, searches for the given block, then selects the
 * first result that appears from the block directory. It then waits briefly for the block list to
 * update.
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function insertBlockDirectoryBlock( searchTerm ) {
	await searchForBlock( searchTerm );

	// Grab the first block in the list
	const insertButton = await page.waitForSelector(
		'.block-directory-downloadable-blocks-list li:first-child button'
	);
	await insertButton.click();
	// We should wait until the inserter closes and the focus moves to the content.
	await waitForInserterCloseAndContentFocus();
}
