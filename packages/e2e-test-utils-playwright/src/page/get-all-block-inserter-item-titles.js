/**
 * External dependencies
 */
import { sortBy, uniq } from 'lodash';

/**
 * Returns an array of strings with all inserter item titles.
 *
 * @this {import('./').PageUtils}
 * @return {Promise} Promise resolving with an array containing all inserter item titles.
 */
export async function getAllBlockInserterItemTitles() {
	await this.page.waitForLoadState( 'networkidle' );

	const inserterItemTitles = [];

	const locators = this.page.locator(
		'.block-editor-block-types-list__item-title'
	);
	const count = await locators.count();

	for ( let i = 0; i < count; i++ ) {
		inserterItemTitles.push( await locators.nth( i ).textContent() );
	}

	return sortBy( uniq( inserterItemTitles ) );
}
