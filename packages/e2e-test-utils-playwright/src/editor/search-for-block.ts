/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Search for block in the global inserter
 *
 * @param {Editor} this
 * @param {string} searchTerm The text to search the inserter for.
 */

export async function searchForBlock( this: Editor, searchTerm: string ) {
	// If the inserter is not open, open it.
	const inserterButton = this.page.locator(
		'role=button[name="Toggle block inserter"i]'
	);

	if ( ( await inserterButton.getAttribute( 'aria-pressed' ) ) === 'false' ) {
		await inserterButton.click();
	}

	// Enter the search term into the search field.
	const searchField = this.page.locator(
		'.components-search-control__input'
	);
	await searchField.type( searchTerm );
}
