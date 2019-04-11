/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import os from 'os';
import uuid from 'uuid/v4';

/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	createNewPost,
	clickBlockToolbarButton,
	clickButton,
} from '@wordpress/e2e-test-utils';

describe( 'adding inline tokens', () => {
	beforeAll( async () => {
		await createNewPost();
	} );

	it( 'should insert inline image', async () => {
		// Create a paragraph.
		await clickBlockAppender();
		await page.keyboard.type( 'a ' );

		await clickBlockToolbarButton( 'More Rich Text Controls' );
		await clickButton( 'Inline Image' );

		// Wait for media modal to appear and upload image.
		await page.waitForSelector( '.media-modal input[type=file]' );
		const inputElement = await page.$( '.media-modal input[type=file]' );
		const testImagePath = path.join( __dirname, '..', 'assets', '10x10_e2e_test_image_z9T8jK.png' );
		const filename = uuid();
		const tmpFileName = path.join( os.tmpdir(), filename + '.png' );
		fs.copyFileSync( testImagePath, tmpFileName );
		await inputElement.uploadFile( tmpFileName );

		// Wait for upload.
		await page.waitForSelector( `.media-modal li[aria-label="${ filename }"]` );

		// Insert the uploaded image.
		await page.click( '.media-modal button.media-button-select' );

		// Check the content.
		const regex = new RegExp( `<!-- wp:paragraph -->\\s*<p>a <img class="wp-image-\\d+" style="width:\\s*10px;?" src="[^"]+\\/${ filename }\\.png" alt=""\\/?><\\/p>\\s*<!-- \\/wp:paragraph -->` );
		expect( await getEditedPostContent() ).toMatch( regex );
	} );
} );
