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
	insertBlock,
	getEditedPostContent,
	createNewPost,
	clickButton,
} from '@wordpress/e2e-test-utils';

async function upload( selector ) {
	await page.waitForSelector( selector );
	const inputElement = await page.$( selector );
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
	await page.waitForSelector(
		`.wp-block-gallery img[src$="${ filename }.png"]`
	);
	return filename;
}

describe( 'Gallery', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be created using uploaded images', async () => {
		await insertBlock( 'Gallery' );
		const filename = await upload( '.wp-block-gallery input[type="file"]' );

		const regex = new RegExp(
			`<!-- wp:gallery {"ids":\\[\\d+\\]} -->\\s*<figure class="wp-block-gallery columns-1 is-cropped"><ul class="blocks-gallery-grid"><li class="blocks-gallery-item"><figure><img src="[^"]+\\/${ filename }\\.png" alt="" data-id="\\d+" data-link=".+" class="wp-image-\\d+"\\/><\\/figure><\\/li><\\/ul><\\/figure>\\s*<!-- \\/wp:gallery -->`
		);
		expect( await getEditedPostContent() ).toMatch( regex );
	} );

	it( 'when initially added the media library shows the Create Gallery view', async () => {
		await insertBlock( 'Gallery' );
		await clickButton( 'Media Library' );
		await page.waitForSelector( '.media-frame' );
		const mediaLibraryHeaderText = await page.$eval(
			'.media-frame-title h1',
			( element ) => element.textContent
		);
		const mediaLibraryButtonText = await page.$eval(
			'.media-toolbar-primary button',
			( element ) => element.textContent
		);

		expect( mediaLibraryHeaderText ).toBe( 'Create Gallery' );
		expect( mediaLibraryButtonText ).toBe( 'Create a new gallery' );

		// Unfortunately the Media Library has invalid HTML.
		// Axe tests fail with the following error:
		// `List element has direct children with a role that is not allowed: checkbox.`
		await expect( page ).not.toPassAxeTests();
	} );
} );
