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
	activatePlugin,
	createNewPost,
	clickButton,
	deactivatePlugin,
	insertBlock,
	openDocumentSettingsSidebar,
} from '@wordpress/e2e-test-utils';

describe( 'changing image size', () => {
	beforeEach( async () => {
		await activatePlugin( 'gutenberg-test-image-size' );
		await createNewPost();
	} );

	afterEach( async () => {
		await deactivatePlugin( 'gutenberg-test-image-size' );
	} );

	it( 'should insert and change my image size', async () => {
		await insertBlock( 'Image' );
		await clickButton( 'Media Library' );

		// Wait for media modal to appear and upload image.
		await page.waitForSelector( '.media-modal input[type=file]' );
		const inputElement = await page.$( '.media-modal input[type=file]' );
		const testImagePath = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'assets',
			'1024x768_e2e_test_image_size.jpg'
		);
		const filename = uuid();
		const tmpFileName = path.join( os.tmpdir(), filename + '.jpg' );
		fs.copyFileSync( testImagePath, tmpFileName );
		await inputElement.uploadFile( tmpFileName );

		// Wait for upload to finish.
		await page.waitForSelector(
			`.media-modal li[aria-label="${ filename }"]`
		);

		// Insert the uploaded image.
		await page.click( '.media-modal button.media-button-select' );

		// Select the new size updated with the plugin.
		await openDocumentSettingsSidebar();
		const imageSizeLabel = await page.waitForXPath(
			'//label[text()="Image size"]'
		);
		await imageSizeLabel.click();
		const imageSizeSelect = await page.evaluateHandle(
			() => document.activeElement
		);
		await imageSizeSelect.select( 'custom-size-one' );

		// Verify that the custom size was applied to the image.
		await page.waitForSelector( '.wp-block-image.size-custom-size-one' );
		await page.waitForFunction(
			() =>
				document.querySelector(
					'.block-editor-image-size-control__width input'
				).value === '499'
		);
	} );
} );
