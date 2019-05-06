/**
 * Internal dependencies
 */
import { openGlobalBlockInserter } from './open-global-block-inserter';

/**
 * Search for block in the global inserter
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function searchForBlock( searchTerm ) {
	await openGlobalBlockInserter();
	await page.keyboard.type( searchTerm );
}
