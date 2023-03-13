/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	createNewPost,
	clickBlockToolbarButton,
	clickButton,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

describe( 'adding inline tokens', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should insert inline image', async () => {
		// Create a paragraph.
		await clickBlockAppender();
		await page.keyboard.type( 'a ' );

		await clickBlockToolbarButton( 'More' );
		await clickButton( 'Inline image' );

		// Wait for media modal to appear and upload image.
		// Wait for media modal to appear and upload image.
		const inputElement = await page.waitForSelector(
			'.media-modal .moxie-shim input[type=file]'
		);
		const testImagePath = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'assets',
			'10x10_e2e_test_image_z9T8jK.png'
		);
		const filename = uuid();
		const tmpFileName = path.join( os.tmpdir(), filename + '.png' );
		fs.copyFileSync( testImagePath, tmpFileName );
		await inputElement.uploadFile( tmpFileName );

		// Wait for upload.
		await page.waitForSelector(
			`.media-modal li[aria-label="${ filename }"]`
		);

		// Insert the uploaded image.
		await page.click( '.media-modal button.media-button-select' );

		// Check the content.
		const regex = new RegExp(
			`<!-- wp:paragraph -->\\s*<p>a <img class="wp-image-\\d+" style="width:\\s*10px;?" src="[^"]+\\/${ filename }\\.png" alt=""\\/?><\\/p>\\s*<!-- \\/wp:paragraph -->`
		);
		expect( await getEditedPostContent() ).toMatch( regex );

		await pressKeyWithModifier( 'shift', 'ArrowLeft' );
		await page.waitForSelector(
			'.block-editor-format-toolbar__image-popover'
		);
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( '20' );
		await page.keyboard.press( 'Enter' );

		// Check the content.
		const regex2 = new RegExp(
			`<!-- wp:paragraph -->\\s*<p>a <img class="wp-image-\\d+" style="width:\\s*20px;?" src="[^"]+\\/${ filename }\\.png" alt=""\\/?><\\/p>\\s*<!-- \\/wp:paragraph -->`
		);
		expect( await getEditedPostContent() ).toMatch( regex2 );
	} );
} );
