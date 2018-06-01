/**
 * Node dependencies
 */
import path from 'path';

/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost, newDesktopBrowserPage, getHTMLFromCodeEditor } from '../support/utils';

describe( 'adding inline tokens', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
		await newPost();
	} );

	it( 'Should insert inline image', async () => {
		// Create a paragraph.
		await page.click( '.editor-default-block-appender' );
		await page.keyboard.type( 'Paragraph with inline image: ' );

		// Use the global inserter to add an inline image.
		await page.click( '.edit-post-header [aria-label="Add block"]' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );

		// The media modal appears. Upload the test image.
		const inputElement = await page.$( 'input[type=file]' );
		const testImagePath = path.join( __dirname, '..', 'assets', '10x10_e2e_test_image_z9T8jK.png' );
		await inputElement.uploadFile( testImagePath );

		// Wait for upload.
		await page.waitForSelector( 'li[aria-label="10x10_e2e_test_image_z9T8jK"]' );

		// Insert the uploaded image.
		await page.click( 'button.media-button-select' );

		// Check the content.
		expect( await getHTMLFromCodeEditor() ).toMatch( /<!-- wp:paragraph -->\s*<p>Paragraph with inline image:\u00A0<img class="wp-image-\d+" style="width:10px" src="[^"]+\/10x10_e2e_test_image_z9T8jK\.png" alt="" \/><\/p>\s*<!-- \/wp:paragraph -->/ );

		// Open the media modal again by using the globar inserter
		await page.click( '.edit-post-header [aria-label="Add block"]' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );

		// Confirm deletion.
		page.on( 'dialog', async ( dialog ) => {
			await dialog.accept();
		} );

		// Delete the test image (first item).
		await page.click( 'li.attachment' );
		await page.click( 'button.delete-attachment' );
	} );
} );
