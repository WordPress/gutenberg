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
	createNewPost,
	activatePlugin,
	clickBlockAppender,
	clickBlockToolbarButton,
	insertBlock,
} from '@wordpress/e2e-test-utils';

describe( 'changing image size', () => {
	beforeEach( async () => {
		await activatePlugin( 'gutenberg-test-image-size' );
		await createNewPost();
	} );

	it( 'should insert and change my image size', async () => {
		const expectedImageWidth = 499;

		// Create a paragraph.
		await insertBlock( 'Image' );
		await page.click( '.editor-media-placeholder__media-library-button' );

		// Wait for media modal to appear and upload image.
		await page.waitForSelector( '.media-modal input[type=file]' );
		const inputElement = await page.$( '.media-modal input[type=file]' );
		const testImagePath = path.join( __dirname, '..', 'assets', '1024x768_e2e_test_image_size.jpg' );
		const filename = uuid();
		const tmpFileName = path.join( os.tmpdir(), filename + '.jpg' );
		fs.copyFileSync( testImagePath, tmpFileName );
		await inputElement.uploadFile( tmpFileName );

		// Wait for upload.
		await page.waitForSelector( `.media-modal li[aria-label="${ filename }"]` );

		// Insert the uploaded image.
		await page.click( '.media-modal button.media-button-select' );

		// Select the new size I created with the plugin
		const element = await page.$( '.components-base-control__label + select > option:last-child' );
		const value = await( await element.getProperty( 'value' ) ).jsonValue();

		await page.select( '.components-base-control__label + select', value );

		// Get the size of the image{}
		const size = await page.$eval( '.block-library-image__dimensions__width input', ( el ) => parseInt( el.value, 10 ) );
		expect( size ).toBe( expectedImageWidth );

		expect( console ).toHaveErrored();
	} );
} );
