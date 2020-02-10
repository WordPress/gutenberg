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
	getEditedPostContent,
	createNewPost,
	insertBlock,
	pressKeyWithModifier,
	clickBlockToolbarButton,
	clickButton,
} from '@wordpress/e2e-test-utils';

describe( 'Classic', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should be inserted', async () => {
		await insertBlock( 'Classic' );
		// Wait for TinyMCE to initialise.
		await page.waitForSelector( '.mce-content-body' );
		// Ensure there is focus.
		await page.focus( '.mce-content-body' );
		await page.keyboard.type( 'test' );
		// Move focus away.
		await pressKeyWithModifier( 'shift', 'Tab' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should insert media, convert to blocks, and undo in one step', async () => {
		await insertBlock( 'Classic' );
		// Wait for TinyMCE to initialise.
		await page.waitForSelector( '.mce-content-body' );
		// Ensure there is focus.
		await page.focus( '.mce-content-body' );
		await page.keyboard.type( 'test' );

		// Click the image button.
		await page.waitForSelector( 'div[aria-label^="Add Media"]' );
		await page.click( 'div[aria-label^="Add Media"]' );
		await page.click( '.media-menu-item#menu-item-gallery' );

		// Wait for media modal to appear and upload image.
		await page.waitForSelector( '.media-modal input[type=file]' );
		const inputElement = await page.$( '.media-modal input[type=file]' );
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
		await page.click( '.media-modal button.media-button-gallery' );
		await page.click( '.media-modal button.media-button-insert' );

		// Wait for image to be inserted.
		await page.waitForSelector( '.mce-content-body img' );

		// Move focus away and verify gallery was inserted.
		await pressKeyWithModifier( 'shift', 'Tab' );
		expect( await getEditedPostContent() ).toMatch(
			/\[gallery ids=\"\d+\"\]/
		);

		// Convert to blocks and verify it worked correctly.
		await clickBlockToolbarButton( 'More options' );
		await clickButton( 'Convert to Blocks' );
		await page.waitForSelector( '.wp-block[data-type="core/gallery"]' );
		expect( await getEditedPostContent() ).toMatch( /<!-- wp:gallery/ );

		// Check that you can undo back to a Classic block gallery in one step.
		await pressKeyWithModifier( 'primary', 'z' );
		expect( await getEditedPostContent() ).toMatch(
			/\[gallery ids=\"\d+\"\]/
		);

		// Convert to blocks again and verify it worked correctly.
		await clickBlockToolbarButton( 'More options' );
		await clickButton( 'Convert to Blocks' );
		await page.waitForSelector( '.wp-block[data-type="core/gallery"]' );
		expect( await getEditedPostContent() ).toMatch( /<!-- wp:gallery/ );
	} );
} );
