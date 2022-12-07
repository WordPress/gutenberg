/**
 * Internal dependencies
 */
import { pressKeyWithModifier } from './press-key-with-modifier';
import { canvas } from './canvas';

// This selector is written to support the current and old inserter markup
// because the performance tests need to be able to run across versions.
const INSERTER_SEARCH_SELECTOR =
	'.block-editor-inserter__search input,.block-editor-inserter__search-input,input.block-editor-inserter__search';

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
		// render than Puppeteer takes to complete the 'click' action.
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
		// "Add block" selector is required to make sure performance comparison
		// doesn't fail on older branches where we still had "Add block" as label.
		return !! document.querySelector(
			'.edit-post-header [aria-label="Add block"].is-pressed,' +
				'.edit-site-header-edit-mode [aria-label="Add block"].is-pressed,' +
				'.edit-post-header [aria-label="Toggle block inserter"].is-pressed,' +
				'.edit-site-header [aria-label="Toggle block inserter"].is-pressed,' +
				'.edit-widgets-header [aria-label="Toggle block inserter"].is-pressed,' +
				'.edit-widgets-header [aria-label="Add block"].is-pressed,' +
				'.edit-site-header-edit-mode__inserter-toggle.is-pressed'
		);
	} );
}
/**
 * Toggles the global inserter.
 */
export async function toggleGlobalBlockInserter() {
	// "Add block" selector is required to make sure performance comparison
	// doesn't fail on older branches where we still had "Add block" as label.
	await page.click(
		'.edit-post-header [aria-label="Add block"],' +
			'.edit-site-header [aria-label="Add block"],' +
			'.edit-post-header [aria-label="Toggle block inserter"],' +
			'.edit-site-header [aria-label="Toggle block inserter"],' +
			'.edit-widgets-header [aria-label="Add block"],' +
			'.edit-widgets-header [aria-label="Toggle block inserter"],' +
			'.edit-site-header-edit-mode__inserter-toggle'
	);
}

/**
 * Moves focus to the selected block.
 */
async function focusSelectedBlock() {
	// Ideally there shouuld be a UI way to do this. (Focus the selected block)
	await page.evaluate( () => {
		wp.data
			.dispatch( 'core/block-editor' )
			.selectBlock(
				wp.data
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
	await canvas().waitForFunction(
		() =>
			document.activeElement.closest(
				'.block-editor-block-list__layout'
			) !== null
	);
}

// async function selectInserterTab( label ) {
// 	let selector;

// 	switch ( label ) {
// 		case 'Blocks':
// 		case 'Patterns':
// 		case 'Media':
// 			selector = `.="${ label }"`;
// 			break;
// 		case 'Reusable':
// 			// Reusable tab label is an icon, hence the different selector.
// 			selector = `@aria-label="${ label }"`;
// 			break;
// 	}

// 	const tab = await page.waitForXPath(
// 		`//div[contains(@class, "block-editor-inserter__tabs")]//button[${ selector }]`
// 	);
// 	await tab.click();
// }

export async function search( category, searchTerm ) {
	await openGlobalBlockInserter();
	await page.waitForSelector( INSERTER_SEARCH_SELECTOR );
	await page.focus( INSERTER_SEARCH_SELECTOR );
	await pressKeyWithModifier( 'primary', 'a' );
	await page.keyboard.type( searchTerm );

	// Wait for the default block list to disappear to prevent its items from
	// being considered as search results.
	await page.waitForSelector( '.block-editor-inserter__block-list', {
		hidden: true,
	} );

	let waitForResult;
	let waitForNoResults;

	switch ( category ) {
		case 'Blocks':
		case 'Patterns':
		case 'Reusable': {
			waitForResult = async () => {
				return await page.waitForXPath(
					`//*[@role='option' and contains(., '${ searchTerm }')]`
				);
			};
			waitForNoResults = async () => {
				await page.waitForSelector(
					'.block-editor-inserter__no-results'
				);
				return null;
			};
			break;
		}
		case 'Block Directory': {
			waitForResult = async () => {
				return await page.waitForSelector(
					'.block-directory-downloadable-blocks-list button:first-child'
				);
			};
			waitForNoResults = async () => {
				return new Promise( ( resolve ) =>
					setTimeout( () => resolve( null ), 5000 )
				);
			};
		}
	}

	return await Promise.race( [ waitForResult(), waitForNoResults() ] );
}

export async function insert( category, searchTerm ) {
	const insertButton = await search( category, searchTerm );
	if ( ! insertButton ) {
		throw new Error(
			`No results for "${ searchTerm }" search term in the ${ category } category.`
		);
	}

	await insertButton.click();

	if ( category === 'Reusable' ) {
		await page.waitForSelector(
			'.block-library-block__reusable-block-container'
		);
	}

	if ( category === 'Block Directory' ) {
		await page.waitForSelector(
			'.block-directory-downloadable-blocks-list button:first-child:not(.is-busy)'
		);
	}

	await focusSelectedBlock();
	await waitForInserterCloseAndContentFocus();
}

/**
 * Search for a block in the global inserter.
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function searchForBlock( searchTerm ) {
	return await search( 'Blocks', searchTerm );
}

/**
 * Search for a pattern.
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function searchForPattern( searchTerm ) {
	return await search( 'Patterns', searchTerm );
}

/**
 * Search for a reusable block.
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function searchForReusableBlock( searchTerm ) {
	return await search( 'Reusable', searchTerm );
}

/**
 * Search for a Block Directory block.
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function searchForBlockDirectoryBlock( searchTerm ) {
	return await search( 'Block Directory', searchTerm );
}

/**
 * Insert a block matching a given search term.
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function insertBlock( searchTerm ) {
	return await insert( 'Blocks', searchTerm );
}

/**
 * Insert a pattern matching a given search term..
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function insertPattern( searchTerm ) {
	await insert( 'Patterns', searchTerm );
}

/**
 * Insert a reusable block matching a given search term.
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function insertReusableBlock( searchTerm ) {
	await insert( 'Reusable', searchTerm );
}

/**
 * Insert a Block Directory block matching a given search term.
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function insertBlockDirectoryBlock( searchTerm ) {
	return await insert( 'Block Directory', searchTerm );
}
