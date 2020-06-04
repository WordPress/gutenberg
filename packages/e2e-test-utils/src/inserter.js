/**
 * Internal dependencies
 */
import { pressKeyWithModifier } from './press-key-with-modifier';

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

async function toggleGlobalBlockInserter() {
	await page.click(
		'.edit-post-header [aria-label="Add block"], .edit-site-header [aria-label="Add block"]'
	);
}

/**
 * Search for block in the global inserter
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function searchForBlock( searchTerm ) {
	await openGlobalBlockInserter();
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
	const [ tab ] = await page.$x(
		'//div[contains(@class, "block-editor-inserter__tabs")]//button[.="Patterns"]'
	);
	await tab.click();
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
	const insertButton = (
		await page.$x( `//button//span[contains(text(), '${ searchTerm }')]` )
	 )[ 0 ];
	await insertButton.click();
}

/**
 * Opens the inserter, searches for the given pattern, then selects the first
 * result that appears. It then waits briefly for the block list to update.
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function insertPattern( searchTerm ) {
	await searchForPattern( searchTerm );
	const insertButton = (
		await page.$x(
			`//div[@role = 'button']//div[contains(text(), '${ searchTerm }')]`
		)
	 )[ 0 ];
	await insertButton.click();
}
