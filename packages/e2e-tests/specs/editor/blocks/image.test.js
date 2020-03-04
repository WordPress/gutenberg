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
	insertBlock,
	getEditedPostContent,
	createNewPost,
} from '@wordpress/e2e-test-utils';

describe( 'Image', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be inserted', async () => {
		await insertBlock( 'Image' );
		await page.waitForSelector( '.wp-block-image input[type="file"]' );
		const inputElement = await page.$(
			'.wp-block-image input[type="file"]'
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
		await page.waitForSelector( '.wp-block-image img[src^="http"]' );

		// Check the content.
		const regex = new RegExp(
			`<!-- wp:image {"id":\\d+,"sizeSlug":"large"} -->\\s*<figure class="wp-block-image size-large"><img src="[^"]+\\/${ filename }\\.png" alt="" class="wp-image-\\d+"/></figure>\\s*<!-- \\/wp:image -->`
		);
		expect( await getEditedPostContent() ).toMatch( regex );
	} );
} );
