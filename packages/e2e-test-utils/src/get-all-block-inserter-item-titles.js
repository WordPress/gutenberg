/**
 * Returns an array of strings with all inserter item titles.
 *
 * @return {Promise} Promise resolving with an array containing all inserter item titles.
 */
export async function getAllBlockInserterItemTitles() {
	// The inserter render lazy renders the list of blocks
	// meaning we should wait for the browser to be completed idle.
	// Ideally, we shouldn't use a timeout and instead check the browser is idle for
	// a specific duration, but didn't manage to find a simple way to do that.
	// eslint-disable-next-line no-restricted-syntax
	await page.waitForTimeout( 500 );

	const inserterItemTitles = await page.evaluate( () => {
		return Array.from(
			document.querySelectorAll(
				'.block-editor-block-types-list__item-title'
			)
		).map( ( inserterItem ) => {
			return inserterItem.innerText;
		} );
	} );
	return [ ...new Set( inserterItemTitles ) ].sort();
}
