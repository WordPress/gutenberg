/**
 * Internal dependencies
 */
import {
	newPost,
	insertBlock,
	getEditedPostContent,
	pressTimes,
} from '../support/utils';

describe( 'Navigating the block hierarchy', () => {
	beforeAll( async () => {
		await newPost();
	} );

	it( 'Should navigate using the block hierarchy dropdown menu', async () => {
		await insertBlock( 'Columns (beta)' );

		// Add a paragraph in the first column
		await page.keyboard.type( 'First column' );

		// Navigate to the columns blocks
		await page.click( '[aria-label="Block Navigation"]' );
		const columnsBlockMenuItem = ( await page.$x( "//button[contains(@class,'editor-block-navigation__item') and contains(text(), 'Columns (beta)')]" ) )[ 0 ];
		await columnsBlockMenuItem.click();

		// Tweak the columns count
		await page.focus( '.edit-post-block-sidebar__panel .components-range-control__number[aria-label="Columns"]' );
		page.keyboard.down( 'Shift' );
		page.keyboard.press( 'ArrowLeft' );
		page.keyboard.up( 'Shift' );
		page.keyboard.type( '3' );

		// Navigate to the last column blosck
		await page.click( '[aria-label="Block Navigation"]' );
		const lastColumnsBlockMenuItem = ( await page.$x( "//button[contains(@class,'editor-block-navigation__item') and contains(text(), 'Column')]" ) )[ 3 ];
		await lastColumnsBlockMenuItem.click();

		// Insert text in the last column block
		await pressTimes( 'Tab', 2 ); // Navigate to the appender
		await page.keyboard.type( 'Third column' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
