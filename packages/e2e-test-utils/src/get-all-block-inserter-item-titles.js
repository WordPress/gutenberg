/**
 * External dependencies
 */
import { sortBy, uniq } from 'lodash';

/**
 * Returns an array of strings with all inserter item titles.
 *
 * @return {Promise} Promise resolving with an array containing all inserter item titles.
 */
export async function getAllBlockInserterItemTitles() {
	const inserterItemTitles = await page.evaluate( () => {
		return Array.from(
			document.querySelectorAll(
				'.block-editor-inserter__results .block-editor-block-types-list__item-title'
			)
		).map(
			( inserterItem ) => {
				return inserterItem.innerText;
			}
		);
	} );
	return sortBy( uniq( inserterItemTitles ) );
}
