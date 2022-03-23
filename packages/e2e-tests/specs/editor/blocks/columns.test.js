/**
 * WordPress dependencies
 */
import {
	createNewPost,
	getAllBlockInserterItemTitles,
	insertBlock,
	openGlobalBlockInserter,
	closeGlobalBlockInserter,
} from '@wordpress/e2e-test-utils';

async function getListViewBlocks( blockLabel ) {
	return page.$x(
		`//table[contains(@aria-label,'Block navigation structure')]//span[contains(@class,'block-editor-list-view-block-select-button__title') and text()='${ blockLabel }']`
	);
}

describe( 'Columns', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'restricts all blocks inside the columns block', async () => {
		await insertBlock( 'Columns' );
		await closeGlobalBlockInserter();
		await page.click( '[aria-label="Two columns; equal split"]' );
		await page.click( '.edit-post-header-toolbar__list-view-toggle' );

		const columnBlockMenuItem = (
			await getListViewBlocks( 'Column' )
		 )[ 0 ];
		await columnBlockMenuItem.click();
		await openGlobalBlockInserter();
		expect( await getAllBlockInserterItemTitles() ).toHaveLength( 1 );
	} );
} );
