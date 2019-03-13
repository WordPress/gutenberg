/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	getEditedPostContent,
	pressKeyTimes,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

async function openBlockNavigator() {
	await pressKeyWithModifier( 'access', 'o' );
}

describe( 'Navigating the block hierarchy', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should navigate using the block hierarchy dropdown menu', async () => {
		await insertBlock( 'Columns' );

		// Add a paragraph in the first column.
		await page.keyboard.type( 'First column' );

		// Navigate to the columns blocks.
		await page.click( '[aria-label="Block Navigation"]' );
		const columnsBlockMenuItem = ( await page.$x( "//button[contains(@class,'block-editor-block-navigation__item') and contains(text(), 'Columns')]" ) )[ 0 ];
		await columnsBlockMenuItem.click();

		// Tweak the columns count.
		await page.focus( '.edit-post-settings-sidebar__panel-block .components-range-control__number[aria-label="Columns"]' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		await page.keyboard.type( '3' );

		// Navigate to the last column block.
		await page.click( '[aria-label="Block Navigation"]' );
		const lastColumnsBlockMenuItem = ( await page.$x(
			"//button[contains(@class,'block-editor-block-navigation__item') and contains(text(), 'Column')]"
		) )[ 3 ];
		await lastColumnsBlockMenuItem.click();

		// Insert text in the last column block.
		await pressKeyTimes( 'Tab', 2 ); // Navigate to the appender.
		await page.keyboard.type( 'Third column' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should navigate block hierarchy using only the keyboard', async () => {
		await insertBlock( 'Columns' );

		// Add a paragraph in the first column.
		await page.keyboard.type( 'First column' );

		// Navigate to the columns blocks using the keyboard.
		await openBlockNavigator();
		await page.keyboard.press( 'Enter' );

		// Move focus to the sidebar area.
		await pressKeyWithModifier( 'ctrl', '`' );
		await pressKeyWithModifier( 'ctrl', '`' );
		await pressKeyWithModifier( 'ctrl', '`' );
		await pressKeyWithModifier( 'ctrl', '`' );
		await pressKeyTimes( 'Tab', 4 );

		// Tweak the columns count by increasing it by one.
		page.keyboard.press( 'ArrowRight' );

		// Navigate to the last column in the columns block.
		await openBlockNavigator();
		await pressKeyTimes( 'Tab', 4 );
		await page.keyboard.press( 'Enter' );

		// Insert text in the last column block
		await pressKeyTimes( 'Tab', 2 ); // Navigate to the appender.
		await page.keyboard.type( 'Third column' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should appear and function even without nested blocks', async () => {
		await insertBlock( 'Paragraph' );

		// Add content so there is a block in the hierachy.
		await page.keyboard.type( 'You say goodbye' );

		// Create an image block too.
		await page.keyboard.press( 'Enter' );
		await insertBlock( 'Image' );

		// Return to first block.
		await openBlockNavigator();
		await page.keyboard.press( 'Space' );

		// Replace its content.
		await pressKeyWithModifier( 'primary', 'A' );
		await page.keyboard.type( 'and I say hello' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
