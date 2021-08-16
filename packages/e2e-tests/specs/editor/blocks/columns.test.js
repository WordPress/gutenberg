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

describe( 'Columns', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'restricts all blocks inside the columns block', async () => {
		await insertBlock( 'Columns' );
		await closeGlobalBlockInserter();
		await page.click( '[aria-label="Two columns; equal split"]' );
		await page.click( '.edit-post-header-toolbar__list-view-toggle' );
		await page.click(
			'.block-editor-list-view-block-select-button:text-is("Column")'
		);
		await openGlobalBlockInserter();

		expect( await getAllBlockInserterItemTitles() ).toHaveLength( 1 );
	} );
} );
