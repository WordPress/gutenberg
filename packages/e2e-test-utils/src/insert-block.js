/**
 * Internal dependencies
 */
import { searchForBlock } from './search-for-block';

/**
 * Opens the inserter, searches for the given term, then selects the first
 * result that appears.
 *
 * @param {string} searchTerm The text to search the inserter for.
 * @param {string} panelName  The inserter panel to open (if it's closed by default).
 */
export async function insertBlock( searchTerm, panelName = null ) {
	await searchForBlock( searchTerm );
	if ( panelName ) {
		const panelButton = ( await page.$x(
			`//button[contains(text(), '${ panelName }')]`
		) )[ 0 ];
		await panelButton.click();
	}
	const insertButton = ( await page.$x(
		`//button//span[contains(text(), '${ searchTerm }')]`
	) )[ 0 ];
	await insertButton.click();
}
