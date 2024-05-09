/**
 * External dependencies
 */
import { ElementHandle } from 'puppeteer-core';

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
 * Opens the global inserter.
 */
export async function openGlobalBlockInserter() {
	if ( ! ( await isGlobalInserterOpen() ) ) {
		await toggleGlobalBlockInserter();

		// Waiting here is necessary because sometimes the inserter takes more
		// time to render than Puppeteer takes to complete the 'click' action.
		await page.waitForSelector( '.block-editor-inserter__menu' );
	}
}

/**
 * Closes the global inserter.
 */
export async function closeGlobalBlockInserter() {
	if ( await isGlobalInserterOpen() ) {
		await toggleGlobalBlockInserter();
	}
}

/**
 * Checks if the global inserter is open.
 *
 * @return {Promise<boolean>} Whether the inserter is open or not.
 */
async function isGlobalInserterOpen() {
	return await page.evaluate( () => {
		// "Add block" selector is required to make sure performance comparison
		// doesn't fail on older branches where we still had "Add block" as
		// label.
		return !! document.querySelector(
			'.edit-post-header [aria-label="Add block"].is-pressed,' +
				'.edit-site-header-edit-mode [aria-label="Add block"].is-pressed,' +
				'.edit-post-header [aria-label="Block Inserter"].is-pressed,' +
				'.edit-site-header [aria-label="Block Inserter"].is-pressed,' +
				'.edit-widgets-header [aria-label="Block Inserter"].is-pressed,' +
				'.edit-widgets-header [aria-label="Add block"].is-pressed,' +
				'.edit-site-header-edit-mode__inserter-toggle.is-pressed,' +
				'.editor-header [aria-label="Block Inserter"].is-pressed'
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
		'.editor-document-tools__inserter-toggle,' +
			'.edit-post-header [aria-label="Add block"],' +
			'.edit-site-header [aria-label="Add block"],' +
			'.edit-post-header [aria-label="Block Inserter"],' +
			'.edit-site-header [aria-label="Block Inserter"],' +
			'.edit-widgets-header [aria-label="Add block"],' +
			'.edit-widgets-header [aria-label="Block Inserter"],' +
			'.edit-site-header-edit-mode__inserter-toggle'
	);
}

/**
 * Selects the global inserter tab/category, unless it's already selected.
 *
 * @param {string} label The label of the tab to select.
 */
export async function selectGlobalInserterTab( label ) {
	const tabs = await page.$( '.block-editor-inserter__tabs' );
	if ( ! tabs ) {
		return; // Do nothing if tabs are unavailable (e.g. for inner blocks).
	}

	const activeTab = await page.waitForSelector(
		// Targeting a class name is necessary here, because there are likely
		// two implementations of the `Tabs` component visible to this test, and
		// we want to confirm that it's waiting for the correct one.
		'.block-editor-inserter__tabs [role="tab"][aria-selected="true"]'
	);

	const activeTabLabel = await page.evaluate(
		( el ) => el.innerText,
		activeTab
	);

	if ( activeTabLabel === label ) {
		return; // Do nothing if the target tab is already active.
	}

	let labelSelector;

	switch ( label ) {
		case 'Blocks':
		case 'Patterns':
		case 'Media':
			labelSelector = `. = "${ label }"`;
			break;
		case 'Synced patterns':
			// Synced patterns tab label is an icon, hence the different selector.
			labelSelector = `@aria-label = "${ label }"`;
			break;
	}

	const targetTab = await page.waitForXPath(
		`//div[contains(@class, "block-editor-inserter__tabs")]//button[${ labelSelector }]`
	);

	await targetTab.click();
}

/**
 * Moves focus to the selected block.
 */
async function focusSelectedBlock() {
	// Ideally, there should be a UI way to focus the selected block.
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
 * Retrieves the document container by css class and checks to make sure the
 * document's active element is within it.
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
 * Searches for an entity matching given category and term via the global
 * inserter. If nothing is found, null will be returned.
 *
 * Available categories: Blocks, Patterns, Reusable and Block Directory.
 *
 * @param {string} category   The category to search within.
 * @param {string} searchTerm The term to search the inserter for.
 * @return {Promise<ElementHandle|null>} The handle of the element to be
 * inserted or null if nothing was found.
 */
export async function searchGlobalInserter( category, searchTerm ) {
	await openGlobalBlockInserter();
	await page.waitForSelector( INSERTER_SEARCH_SELECTOR );
	await page.focus( INSERTER_SEARCH_SELECTOR );
	await pressKeyWithModifier( 'primary', 'a' );
	await page.keyboard.type( searchTerm );

	// Wait for the default block list to disappear to prevent its items from
	// being considered as search results. This is needed since we're debouncing
	// search request.
	await page.waitForSelector( '.block-editor-inserter__block-list', {
		hidden: true,
	} );

	let waitForInsertElement;
	let waitForNoResults;

	switch ( category ) {
		case 'Blocks':
		case 'Patterns':
		case 'Synced patterns': {
			waitForInsertElement = async () => {
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
			waitForInsertElement = async () => {
				// Return the first item from the Block Directory search results.
				return await page.waitForSelector(
					'.block-directory-downloadable-blocks-list button:first-child'
				);
			};
			waitForNoResults = async () => {
				// Use a soft timeout if Block Directory doesn't return anything
				// within 5 seconds, as there's no "empty results" element being
				// rendered when nothing is found.
				return await new Promise( ( resolve ) =>
					setTimeout( () => resolve( null ), 5000 )
				);
			};
		}
	}

	return await Promise.race( [ waitForInsertElement(), waitForNoResults() ] );
}

/**
 * Inserts an entity matching given category and term via the global inserter.
 * If the entity is not instantly available in the open inserter, a search will
 * be performed. If the search returns no results, an error will be thrown.
 *
 * Available categories: Blocks, Patterns, Synced patterns and Block Directory.
 *
 * @param {string} category   The category to insert from.
 * @param {string} searchTerm The term by which to find the entity to insert.
 */
export async function insertFromGlobalInserter( category, searchTerm ) {
	await openGlobalBlockInserter();
	await selectGlobalInserterTab( category );

	let insertButton;

	if ( [ 'Blocks', 'Synced patterns' ].includes( category ) ) {
		// If it's a block, see if it's insertable without searching...
		try {
			insertButton = (
				await page.$x(
					`//*[@role='option' and contains(., '${ searchTerm }')]`
				)
			)[ 0 ];
		} catch ( error ) {
			// noop
		}
	}

	// ...and if not, perform a global search.
	if ( ! insertButton ) {
		insertButton = await searchGlobalInserter( category, searchTerm );
	}

	// Throw an error if nothing was found.
	if ( ! insertButton ) {
		throw new Error(
			`Couldn't find "${ searchTerm }" in the ${ category } category.`
		);
	}

	// Insert found entity.
	await insertButton.click();

	// Extra wait for the reusable block to be ready.
	if ( category === 'Synced patterns' ) {
		await canvas().waitForSelector(
			'.block-library-block__reusable-block-container'
		);
	}

	// Extra wait for the Block Directory block to be ready.
	if ( category === 'Block Directory' ) {
		await page.waitForSelector(
			'.block-directory-downloadable-blocks-list button:first-child:not(.is-busy)'
		);
	}

	await focusSelectedBlock();
	await waitForInserterCloseAndContentFocus();
}

/**
 * Searches for a block via the global inserter.
 *
 * @param {string} searchTerm The term to search the inserter for.
 * @return {Promise<ElementHandle|null>} The handle of block to be
 * inserted or null if nothing was found.
 */
export async function searchForBlock( searchTerm ) {
	return await searchGlobalInserter( 'Blocks', searchTerm );
}

/**
 * Searches for a pattern via the global inserter.
 *
 * @param {string} searchTerm The term to search the inserter for.
 * @return {Promise<ElementHandle|null>} The handle of the pattern to be
 * inserted or null if nothing was found.
 */
export async function searchForPattern( searchTerm ) {
	return await searchGlobalInserter( 'Patterns', searchTerm );
}

/**
 * Searches for a reusable block via the global inserter.
 *
 * @param {string} searchTerm The term to search the inserter for.
 * @return {Promise<ElementHandle|null>} The handle of the reusable block to be
 * inserted or null if nothing was found.
 */
export async function searchForReusableBlock( searchTerm ) {
	return await searchGlobalInserter( 'Reusable', searchTerm );
}

/**
 * Searches for a Block Directory block via the global inserter.
 *
 * @param {string} searchTerm The term to search the inserter for.
 * @return {Promise<ElementHandle|null>} The handle of the Block Directory block
 * to be inserted or null if nothing was found.
 */
export async function searchForBlockDirectoryBlock( searchTerm ) {
	return await searchGlobalInserter( 'Block Directory', searchTerm );
}

/**
 * Inserts a block matching a given search term via the global inserter.
 *
 * @param {string} searchTerm The term by which to find the block to insert.
 */
export async function insertBlock( searchTerm ) {
	await insertFromGlobalInserter( 'Blocks', searchTerm );
}

/**
 * Inserts a pattern matching a given search term via the global inserter.
 *
 * @param {string} searchTerm The term by which to find the pattern to insert.
 */
export async function insertPattern( searchTerm ) {
	await insertFromGlobalInserter( 'Patterns', searchTerm );
}

/**
 * Inserts a Block Directory block matching a given search term via the global
 * inserter.
 *
 * @param {string} searchTerm The term by which to find the Block Directory
 *                            block to insert.
 */
export async function insertBlockDirectoryBlock( searchTerm ) {
	return await insertFromGlobalInserter( 'Block Directory', searchTerm );
}
