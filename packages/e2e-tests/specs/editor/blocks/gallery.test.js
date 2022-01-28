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
	getAllBlocks,
	selectBlockByClientId,
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
			`<!-- wp:gallery {\\"linkTo\\":\\"none\\"} -->\\s*<figure class=\\"wp-block-gallery has-nested-images columns-default is-cropped\\"><!-- wp:image {\\"id\\":\\d+,\\"sizeSlug\\":\\"full\\",\\"linkDestination\\":\\"none\\"} -->\\s*<figure class=\\"wp-block-image size-full\\"><img src=\\"[^"]+\/${ filename }\.png\\" alt=\\"\\" class=\\"wp-image-\\d+\\"\/><\/figure>\\s*<!-- \/wp:image --><\/figure>\\s*<!-- \/wp:gallery -->`
		);
		expect( await getEditedPostContent() ).toMatch( regex );
	} );

	it( 'gallery caption can be edited', async () => {
		const galleryCaption = 'Tested gallery caption';

		await insertBlock( 'Gallery' );
		await upload( '.wp-block-gallery input[type="file"]' );

		const allBlocks = await getAllBlocks();
		const galleryBlock = allBlocks.find(
			( block ) => block.name === 'core/gallery'
		);
		await selectBlockByClientId( galleryBlock.clientId );

		await page.waitForSelector( '.wp-block-cover img["src^="http://"]' );

		await page.click( '.wp-block-gallery>.blocks-gallery-caption' );
		await page.keyboard.type( galleryCaption );

		expect( await getEditedPostContent() ).toMatch(
			new RegExp( `<figcaption.*?>${ galleryCaption }</figcaption>` )
		);
	} );

	it( "uploaded images' captions can be edited", async () => {
		await insertBlock( 'Gallery' );
		await upload( '.wp-block-gallery input[type="file"]' );

		const figureElement = await page.waitForSelector(
			'.wp-block-gallery .wp-block-image'
		);

		await figureElement.click();

		const captionElement = await figureElement.$(
			'.block-editor-rich-text__editable'
		);

		const caption = 'Tested caption';

		await captionElement.click();
		await page.keyboard.type( caption );

		expect( await getEditedPostContent() ).toMatch(
			new RegExp( `<figcaption.*?>${ caption }</figcaption>` )
		);
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
