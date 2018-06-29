/**
 * Internal dependencies
 */
import '../support/bootstrap';
import {
	newPost,
	newDesktopBrowserPage,
	insertBlock,
	getHTMLFromCodeEditor,
	switchToEditor,
} from '../support/utils';

describe( 'splitting and merging blocks', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
		await newPost();
	} );

	it( 'Should split and merge paragraph blocks using Enter and Backspace', async () => {
		// Use regular inserter to add paragraph block and text
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'FirstSecond' );

		//Move caret between 'First' and 'Second' and press Enter to split paragraph blocks
		for ( let i = 0; i < 6; i++ ) {
			await page.keyboard.press( 'ArrowLeft' );
		}
		await page.keyboard.press( 'Enter' );

		// Assert that there are now two paragraph blocks with correct content
		let textEditorContent = await getHTMLFromCodeEditor();
		expect( textEditorContent ).toMatchSnapshot();

		// Switch to Visual Editor to continue testing
		await switchToEditor( 'Visual' );

		// Press Backspace to merge paragraph blocks
		await page.click( '.is-selected' );
		await page.keyboard.press( 'Home' );
		await page.keyboard.press( 'Backspace' );

		// Ensure that caret position is correctly placed at the between point.
		await page.keyboard.type( 'Between' );

		// Assert that there is now one paragraph with correct content
		textEditorContent = await getHTMLFromCodeEditor();
		expect( textEditorContent ).toMatchSnapshot();
	} );
} );
