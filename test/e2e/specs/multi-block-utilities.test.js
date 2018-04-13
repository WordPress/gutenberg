/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost, newDesktopBrowserPage } from '../support/utils';

describe( 'Multi-block selection', () => {
	beforeEach( async () => {
		await newDesktopBrowserPage();
		await newPost();
	} );

	it( 'Should transform 3 paragraphs into a list', async () => {
		// Create test blocks
		await page.click( '.editor-default-block-appender' );
		await page.keyboard.type( 'First Paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second Paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Third Paragraph' );

		// Multiselect blocks via Shift + click
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.up( 'Shift' );

		// Transform blocks into list
		await page.click( '.editor-block-settings-menu' );
		const listButton = ( await page.$x( '//button[contains(text(), \'List\')]' ) )[ 0 ];
		await listButton.click( 'button' );

		//Switch to Code Editor to check HTML output
		await page.click( '.edit-post-more-menu [aria-label="More"]' );
		const codeEditorButton = ( await page.$x( '//button[contains(text(), \'Code Editor\')]' ) )[ 0 ];
		await codeEditorButton.click( 'button' );

		//Assert that there is only 1 list block
		const textEditorContent = await page.$eval( '.editor-post-text-editor', ( element ) => element.value );
		expect( textEditorContent ).toMatchSnapshot();

		//Switch to Visual Editor to continue testing
		await page.click( '.edit-post-more-menu [aria-label="More"]' );
		const visualEditorButton = ( await page.$x( '//button[contains(text(), \'Visual Editor\')]' ) )[ 0 ];
		await visualEditorButton.click( 'button' );
		await page.close();
	} );

	it( 'Should not transform an image block into a list', async () => {
		//Create test blocks
		await page.click( '.editor-default-block-appender' );
		await page.keyboard.type( 'First Paragraph' );
		await page.click( '.edit-post-header [aria-label="Add block"]' );
		await page.keyboard.type( 'Image' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );
		await page.click( '.edit-post-header [aria-label="Add block"]' );
		await page.keyboard.type( 'Paragraph' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );
        await page.keyboard.type( 'Second Paragraph' );

		// Multiselect blocks via Shift + click
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.up( 'Shift' );

		//Assert that the list button does not appear
		//in the multi-block selection menu
		await page.click( '.editor-block-settings-menu' );
		let listButtonVisible = true;
		try {
			await page.$( '//button[contains(text(), \'List\')]' )[ 0 ];
		} catch ( object ) {
			listButtonVisible = false;
		}
		expect( listButtonVisible ).toBe( false );
	} );

	it( 'Should duplicate a multi-block selection', async () => {
		// Create test blocks
		await page.click( '.editor-default-block-appender' );
		await page.keyboard.type( 'First Paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second Paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Third Paragraph' );

		// Multiselect blocks via Shift + click
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.up( 'Shift' );

		// Duplicate blocks
		await page.click( '.editor-block-settings-menu' );
		const duplicateButton = ( await page.$x( '//button[contains(text(), \'Duplicate\')]' ) )[ 0 ];
		await duplicateButton.click( 'button' );

		//Switch to Code Editor to check HTML output
		await page.click( '.edit-post-more-menu [aria-label="More"]' );
		const codeEditorButton = ( await page.$x( '//button[contains(text(), \'Code Editor\')]' ) )[ 0 ];
		await codeEditorButton.click( 'button' );

		//Assert that there are 6 paragraph blocks
		const textEditorContent = await page.$eval( '.editor-post-text-editor', ( element ) => element.value );
		expect( textEditorContent ).toMatchSnapshot();

		//Switch to Visual Editor to continue testing
		await page.click( '.edit-post-more-menu [aria-label="More"]' );
		const visualEditorButton = ( await page.$x( '//button[contains(text(), \'Visual Editor\')]' ) )[ 0 ];
		await visualEditorButton.click( 'button' );
		await page.close();
	} );

	it( 'Should remove a multi-block selection', async () => {
		// Create test blocks
		await page.click( '.editor-default-block-appender' );
		await page.keyboard.type( 'First Paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second Paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Third Paragraph' );

		// Multiselect blocks via Shift + click
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.up( 'Shift' );

		// Remove blocks
		await page.click( '.editor-block-settings-menu' );
		const removeButton = ( await page.$x( '//button[contains(text(), \'Remove\')]' ) )[ 0 ];
		await removeButton.click( 'button' );

		//Switch to Code Editor to check HTML output
		await page.click( '.edit-post-more-menu [aria-label="More"]' );
		const codeEditorButton = ( await page.$x( '//button[contains(text(), \'Code Editor\')]' ) )[ 0 ];
		await codeEditorButton.click( 'button' );

		//Assert that there are no paragraph blocks
		const textEditorContent = await page.$eval( '.editor-post-text-editor', ( element ) => element.value );
		expect( textEditorContent ).toEqual( '' );
	} );
} );
