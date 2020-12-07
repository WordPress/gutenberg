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
	canvas,
} from '@wordpress/e2e-test-utils';

async function upload( selector ) {
	await canvas().waitForSelector( selector );
	const inputElement = await canvas().$( selector );
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
	await canvas().waitForSelector(
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
			`<!-- wp:gallery {"ids":\\[\\d+\\],"linkTo":"none"} -->\\s*<figure class="wp-block-gallery columns-1 is-cropped"><ul class="blocks-gallery-grid"><li class="blocks-gallery-item"><figure><img src="[^"]+\\/${ filename }\\.png" alt="" data-id="\\d+" data-link=".+" class="wp-image-\\d+"\\/><\\/figure><\\/li><\\/ul><\\/figure>\\s*<!-- \\/wp:gallery -->`
		);
		expect( await getEditedPostContent() ).toMatch( regex );
	} );

	// Disable reason:
	// This test would be good to enable, but the media modal contains an
	// invalid role, which is causing Axe tests to fail:
	// https://core.trac.wordpress.org/ticket/50273
	//
	// Attempts to add an Axe exception for the media modal haven't proved
	// successful:
	// https://github.com/WordPress/gutenberg/pull/22719
	//
	// This test could be re-enabled once the trac ticket is solved.
	// eslint-disable-next-line jest/no-disabled-tests
	it.skip( 'when initially added the media library shows the Create Gallery view', async () => {
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
	} );
} );
