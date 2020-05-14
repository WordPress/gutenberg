/**
 * Internal dependencies
 */
import { searchForBlock } from './search-for-block';
import { getAllBlocks } from './get-all-blocks';

/**
 * Opens the inserter, searches for the given term, then selects the first
 * result that appears. It then waits briefly for the block list to update.
 *
 * @param {string} searchTerm The text to search the inserter for.
 */
export async function insertBlock( searchTerm ) {
	const oldBlocks = getAllBlocks();

	await searchForBlock( searchTerm );
	const insertButton = (
		await page.$x( `//button//span[contains(text(), '${ searchTerm }')]` )
	 )[ 0 ];
	await insertButton.click();

	const waitForBlocksToChange = ( delay = 20 ) =>
		new Promise( ( resolve, reject ) => {
			let elapsedTime = 0;
			const pendingBlockList = setInterval( () => {
				const blocks = getAllBlocks();
				// Reference will change when the selector updates.
				if ( blocks !== oldBlocks ) {
					clearInterval( pendingBlockList );
					resolve();
				}
				elapsedTime += delay;
				if ( elapsedTime > 600 ) {
					clearInterval( pendingBlockList );
					reject( `Block ${ searchTerm } was never inserted.` );
				}
			}, delay );
		} );
	await waitForBlocksToChange();
}
