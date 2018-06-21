/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost, newDesktopBrowserPage, insertBlock, getHTMLFromCodeEditor } from '../support/utils';

describe( 'splitting and merging blocks', () => {
	beforeEach( async () => {
		await newDesktopBrowserPage();
		await newPost();
	} );

	it( 'Should split and merge paragraph blocks using Enter and Backspace', async () => {
		//Use regular inserter to add paragraph block and text
		await insertBlock( 'paragraph' );
		await page.keyboard.type( 'FirstSecond' );

		//Move caret between 'First' and 'Second' and press Enter to split paragraph blocks
		for ( let i = 0; i < 6; i++ ) {
			await page.keyboard.press( 'ArrowLeft' );
		}
		await page.keyboard.press( 'Enter' );

		expect( await getHTMLFromCodeEditor() ).toMatchSnapshot();

		//Press Backspace to merge paragraph blocks
		await page.click( '.is-selected' );
		await page.keyboard.press( 'Home' );
		await page.keyboard.press( 'Backspace' );

		expect( await getHTMLFromCodeEditor() ).toMatchSnapshot();
	} );

	it( 'should split out of quote block using enter', async () => {
		//Use regular inserter to add paragraph block and text
		await insertBlock( 'quote' );
		await page.keyboard.type( 'test' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		expect( await getHTMLFromCodeEditor() ).toMatchSnapshot();
	} );
} );
