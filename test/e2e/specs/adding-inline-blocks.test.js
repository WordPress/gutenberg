/**
 * Node dependencies
 */
import path from 'path';

/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost, newDesktopBrowserPage } from '../support/utils';

const testImage = {
	key: 'z9T8jK',
	fileName: '10x10_e2e_test_image_z9T8jK.png',
	alt: 'test',
};
const testImagePath = path.join( __dirname, '..', 'assets', testImage.fileName );

describe( 'adding inline blocks', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
		await newPost();
	} );

	it( 'Should insert inline image', async () => {
		// Create a paragraph
		await page.click( '.editor-default-block-appender' );
		await page.keyboard.type( 'Paragraph with inline image: ' );

		// Use the global inserter to select Inline Image
		await page.click( '.edit-post-header [aria-label="Add block"]' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );

		// Select Media Library tab
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );

		// Search for test image
		await page.keyboard.type( testImage.key );

		// Wait for image search results
		await page.waitFor( 500 );

		const searchResultElement = await page.$( '.media-frame .attachment' );

		if ( searchResultElement ) {
			await page.keyboard.press( 'Tab' );
			await page.keyboard.press( 'Enter' );
		} else {
			// Upload test image
			const inputElement = await page.$( 'input[type=file]' );
			await inputElement.uploadFile( testImagePath );
			await page.waitFor( 500 );
		}

		// Enter alt text
		await page.click( '.media-frame [data-setting=caption]' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( testImage.alt );

		// Select image
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );

		// Switch to Text Mode to check HTML Output
		await page.click( '.edit-post-more-menu [aria-label="More"]' );
		const codeEditorButton = ( await page.$x( '//button[contains(text(), \'Code Editor\')]' ) )[ 0 ];
		await codeEditorButton.click( 'button' );

		// Assertions
		const textEditorContent = await page.$eval( '.editor-post-text-editor', ( element ) => element.value );

		expect( textEditorContent.indexOf( 'Paragraph with inline image: <img' ) ).not.toBe( -1 );
		expect( textEditorContent.indexOf( `alt="${ testImage.alt }"` ) ).not.toBe( -1 );
		expect( textEditorContent.indexOf( testImage.fileName ) ).not.toBe( -1 );
	} );
} );
