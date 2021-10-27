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
		// Navigate into the placeholder and activate the 50/50 option.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Space' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Space' );
		await closeGlobalBlockInserter();
		await page.click( '.edit-post-header-toolbar__list-view-toggle' );
		const columnBlockMenuItem = (
			await page.$x(
				'//button[contains(concat(" ", @class, " "), " block-editor-list-view-block-select-button ")][text()="Column"]'
			)
		 )[ 0 ];
		await columnBlockMenuItem.click();
		await openGlobalBlockInserter();
		expect( await getAllBlockInserterItemTitles() ).toHaveLength( 1 );
	} );
} );
