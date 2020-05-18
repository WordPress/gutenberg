/**
 * Internal dependencies
 */
import { openGlobalBlockInserter } from './open-global-block-inserter';
import { pressKeyWithModifier } from './press-key-with-modifier';

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
