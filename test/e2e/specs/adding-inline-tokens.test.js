/**
 * Node dependencies
 */
import path from 'path';

/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost, newDesktopBrowserPage, getHTMLFromCodeEditor, insertBlock } from '../support/utils';

describe( 'adding inline tokens', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
		await newPost();
	} );

	it( 'Should insert inline image', async () => {
		// Create a paragraph.
		await page.click( '.editor-default-block-appender' );
		await page.keyboard.type( 'a ' );

		insertBlock( 'Inline Image' );

		// Wait for media modal to appear and upload image.
		await page.waitForSelector( '.media-modal input[type=file]' );
		const inputElement = await page.$( '.media-modal input[type=file]' );
		const testImagePath = path.join( __dirname, '..', 'assets', '10x10_e2e_test_image_z9T8jK.png' );
		await inputElement.uploadFile( testImagePath );

		// Wait for upload.
		await page.waitForSelector( '.media-modal li[aria-label="10x10_e2e_test_image_z9T8jK"]' );

		// Insert the uploaded image.
		await page.click( '.media-modal button.media-button-select' );

		// Check the content.
		expect( await getHTMLFromCodeEditor() ).toMatch( /<!-- wp:paragraph -->\s*<p>a\u00A0<img class="wp-image-\d+" style="width:10px" src="[^"]+\/10x10_e2e_test_image_z9T8jK\.png" alt="" \/><\/p>\s*<!-- \/wp:paragraph -->/ );

		// Open the media modal again by inserting inline image
		insertBlock( 'Inline Image' );

		// Confirm deletion.
		page.on( 'dialog', async ( dialog ) => {
			await dialog.accept();
		} );

		// Wait for media modal to appear and delete image.
		await page.waitForSelector( '.media-modal li.attachment' );
		await page.click( '.media-modal li.attachment' );
		await page.click( '.media-modal button.delete-attachment' );
	} );
} );
