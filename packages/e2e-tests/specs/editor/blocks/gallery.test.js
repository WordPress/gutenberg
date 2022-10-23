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
	openListView,
	getListViewBlocks,
	clickBlockToolbarButton,
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
			`<!-- wp:gallery {\\"linkTo\\":\\"none\\"} -->\\s*<figure class=\\"wp-block-gallery has-nested-images columns-default is-cropped\\"><!-- wp:image {\\"id\\":\\d+,\\"sizeSlug\\":\\"(?:full|large)\\",\\"linkDestination\\":\\"none\\"} -->\\s*<figure class=\\"wp-block-image (?:size-full|size-large)\\"><img src=\\"[^"]+\/${ filename }\.png\\" alt=\\"\\" class=\\"wp-image-\\d+\\"\/><\/figure>\\s*<!-- \/wp:image --><\/figure>\\s*<!-- \/wp:gallery -->`
		);
		expect( await getEditedPostContent() ).toMatch( regex );
	} );

	it( 'gallery caption can be edited', async () => {
		const galleryCaption = 'Tested gallery caption';

		await insertBlock( 'Gallery' );
		await upload( '.wp-block-gallery input[type="file"]' );
		await page.waitForSelector( '.wp-block-gallery .wp-block-image' );

		// The Gallery needs to be selected from the List view panel due to the
		// way that Image uploads take and lose focus.
		await openListView();

		const galleryListLink = ( await getListViewBlocks( 'Gallery' ) )[ 0 ];
		await galleryListLink.click();

		await page.click( '.wp-block-gallery .blocks-gallery-caption' );

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

		// Check that the Image is unselected, in which case the figcaption won't be
		// in the DOM - due the way that the Gallery block handles the upload the latest
		// image gets selected in order to scroll to the position of it, as in large
		// galleries the new upload may be off-canvas. After upload the image is unselected
		// so if we don't check for that it may get unselected again by this flow after we
		// have re-selected it to edit it.
		await page.waitForFunction(
			() => ! document.querySelector( '.wp-block-image figcaption' )
		);

		// The Image needs to be selected from the List view panel due to the
		// way that Image uploads take and lose focus.
		await openListView();

		// Due to collapsed state of ListView nodes Gallery must be expanded to reveal the child blocks.
		// This xpath selects the anchor node for the block which has a child span which contains the text
		// label of the block and then selects the expander span for that node.
		const galleryExpander = await page.waitForXPath(
			`//a[.//span[text()='Gallery']]/span[contains(@class, 'block-editor-list-view__expander')]`
		);

		await galleryExpander.click();

		const imageListLink = ( await getListViewBlocks( 'Image' ) )[ 0 ];
		await imageListLink.click();
		await clickBlockToolbarButton( 'Add caption' );
		const captionElement = await figureElement.$(
			'.block-editor-rich-text__editable'
		);

		await captionElement.click();
		const caption = 'Tested caption';

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
