/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost, newDesktopBrowserPage } from '../support/utils';

describe( 'embedding media', () => {
	beforeEach( async () => {
		await newDesktopBrowserPage();
		await newPost();
		await page.click( '.edit-post-header [aria-label="Add block"]' );
		await page.keyboard.type( 'embed' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );
	} );

	afterEach( async () => {
		//reset view to visual editor for next test
		await page.click( '.edit-post-more-menu [aria-label="More"]' );
		const visualEditorButton = ( await page.$x( '//button[contains(text(), \'Visual Editor\')]' ) )[ 0 ];
		await visualEditorButton.click( 'button' );
	} );

	it( 'Should insert an embedded tweet', async () => {
		//insert a twitter link
		await page.keyboard.type( 'https://twitter.com/WordPress/status/980716623060455424' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );

		//wait for link to resolve and block to rerender
		await page.waitFor( 2000 );

		//Check HTML output
		await page.click( '.edit-post-more-menu [aria-label="More"]' );
		const codeEditorButton = ( await page.$x( '//button[contains(text(), \'Code Editor\')]' ) )[ 0 ];
		await codeEditorButton.click( 'button' );

		//Assert that the editor now has an embedded tweet block
		const textEditorContent = await page.$eval( '.editor-post-text-editor', ( element ) => element.value );
		expect( textEditorContent ).toMatchSnapshot();
	} );

	it( 'Should insert a Youtube video', async () => {
		//insert a youtube link
		await page.keyboard.type( 'https://www.youtube.com/watch?v=CiwJx557ttk' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );

		//wait for link to resolve and block to rerender
		await page.waitFor( 2000 );

		//Check HTML output
		await page.click( '.edit-post-more-menu [aria-label="More"]' );
		const codeEditorButton = ( await page.$x( '//button[contains(text(), \'Code Editor\')]' ) )[ 0 ];
		await codeEditorButton.click( 'button' );

		//Assert that the editor now has an embedded youtube block
		const textEditorContent = await page.$eval( '.editor-post-text-editor', ( element ) => element.value );
		expect( textEditorContent ).toMatchSnapshot();
	} );
} );
