/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost, newDesktopBrowserPage, insertBlock } from '../support/utils';

describe( 'splitting and merging blocks', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
		await newPost();
	} );

	it( 'Should split and merge paragraph blocks using Enter and Backspace', async () => {
		//Use regular inserter to add paragraph block and text
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'FirstSecond' );

		//Move caret between 'First' and 'Second' and press Enter to split paragraph blocks
		for ( let i = 0; i < 6; i++ ) {
			await page.keyboard.press( 'ArrowLeft' );
		}
		await page.keyboard.press( 'Enter' );

		//Switch to Code Editor to check HTML output
		await page.click( '.edit-post-more-menu [aria-label="More"]' );
		let codeEditorButton = ( await page.$x( '//button[contains(text(), \'Code Editor\')]' ) )[ 0 ];
		await codeEditorButton.click( 'button' );

		//Assert that there are now two paragraph blocks with correct content
		let textEditorContent = await page.$eval( '.editor-post-text-editor', ( element ) => element.value );
		expect( textEditorContent ).toMatchSnapshot();

		//Switch to Visual Editor to continue testing
		await page.click( '.edit-post-more-menu [aria-label="More"]' );
		const visualEditorButton = ( await page.$x( '//button[contains(text(), \'Visual Editor\')]' ) )[ 0 ];
		await visualEditorButton.click( 'button' );

		//Press Backspace to merge paragraph blocks
		await page.click( '.is-selected' );
		await page.keyboard.press( 'Home' );
		await page.keyboard.press( 'Backspace' );

		//Switch to Code Editor to check HTML output
		await page.click( '.edit-post-more-menu [aria-label="More"]' );
		codeEditorButton = ( await page.$x( '//button[contains(text(), \'Code Editor\')]' ) )[ 0 ];
		await codeEditorButton.click( 'button' );

		//Assert that there is now one paragraph with correct content
		textEditorContent = await page.$eval( '.editor-post-text-editor', ( element ) => element.value );
		expect( textEditorContent ).toMatchSnapshot();
	} );
} );
