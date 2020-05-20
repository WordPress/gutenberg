/**
 * Internal dependencies
 */
import { pressKeyWithModifier } from './press-key-with-modifier';

/**
 * Opens the global block inserter.
 */
export async function openGlobalBlockInserter() {
	if ( ! ( await isGlobalInserterOpen() ) ) {
		await toggleGlobalBlockInserter();

		// Waiting here is necessary because sometimes the inserter takes more time to
		// render than Puppeteer takes to complete the 'click' action
		await page.waitForSelector( '.block-editor-inserter__menu' );
	}

	// Select the block tab by default if the tabs are visible
	const hasTabs = !! ( await page.$( '.block-editor-inserter__tabs' ) );
	if ( hasTabs ) {
		await page.click(
			'.block-editor-inserter__tabs [aria-controls="0-blocks-view"]'
		);
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
	await page.focus( '.block-editor-inserter__search-input' );
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
	await page.click(
		'.block-editor-inserter__tabs [aria-controls="0-patterns-view"]'
	);
	await page.focus( '.block-editor-inserter__search-input' );
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
