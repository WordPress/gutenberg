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
	openDocumentSettingsSidebar,
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
		`.wp-block-image img[src$="${ filename }.png"]`
	);
	return filename;
}

describe( 'Image', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be inserted', async () => {
		await insertBlock( 'Image' );
		const filename = await upload( '.wp-block-image input[type="file"]' );

		const regex = new RegExp(
			`<!-- wp:image {"id":\\d+,"sizeSlug":"large"} -->\\s*<figure class="wp-block-image size-large"><img src="[^"]+\\/${ filename }\\.png" alt="" class="wp-image-\\d+"/></figure>\\s*<!-- \\/wp:image -->`
		);
		expect( await getEditedPostContent() ).toMatch( regex );
	} );

	it( 'should replace, reset size, and keep selection', async () => {
		await insertBlock( 'Image' );
		const filename1 = await upload( '.wp-block-image input[type="file"]' );

		const regex1 = new RegExp(
			`<!-- wp:image {"id":\\d+,"sizeSlug":"large"} -->\\s*<figure class="wp-block-image size-large"><img src="[^"]+\\/${ filename1 }\\.png" alt="" class="wp-image-\\d+"/></figure>\\s*<!-- \\/wp:image -->`
		);
		expect( await getEditedPostContent() ).toMatch( regex1 );

		await openDocumentSettingsSidebar();
		await page.click( '[aria-label="Image Size"] button' );

		const regex2 = new RegExp(
			`<!-- wp:image {"id":\\d+,"width":3,"height":3,"sizeSlug":"large"} -->\\s*<figure class="wp-block-image size-large is-resized"><img src="[^"]+\\/${ filename1 }\\.png" alt="" class="wp-image-\\d+" width="3" height="3"\\/><\\/figure>\\s*<!-- /wp:image -->`
		);

		expect( await getEditedPostContent() ).toMatch( regex2 );

		await clickButton( 'Replace' );
		const filename2 = await upload(
			'.block-editor-media-replace-flow__options input[type="file"]'
		);

		const regex3 = new RegExp(
			`<!-- wp:image {"id":\\d+,"sizeSlug":"large"} -->\\s*<figure class="wp-block-image size-large"><img src="[^"]+\\/${ filename2 }\\.png" alt="" class="wp-image-\\d+"/></figure>\\s*<!-- \\/wp:image -->`
		);
		expect( await getEditedPostContent() ).toMatch( regex3 );

		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toBe( '' );
	} );
} );
