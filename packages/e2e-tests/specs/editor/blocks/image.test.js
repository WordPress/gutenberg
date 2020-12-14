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
	clickBlockToolbarButton,
	clickMenuItem,
	openDocumentSettingsSidebar,
	pressKeyWithModifier,
	canvas,
} from '@wordpress/e2e-test-utils';

async function upload( selector, frame = canvas() ) {
	await frame.waitForSelector( selector );
	const inputElement = await frame.$( selector );
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
	return filename;
}

async function waitForImage( filename ) {
	await canvas().waitForSelector(
		`.wp-block-image img[src$="${ filename }.png"]`
	);
}

async function getSrc( elementHandle ) {
	return elementHandle.evaluate( ( node ) => node.src );
}
async function getDataURL( elementHandle ) {
	return elementHandle.evaluate( ( node ) => {
		const canvasElement = document.createElement( 'canvas' );
		const context = canvasElement.getContext( '2d' );
		canvasElement.width = node.width;
		canvasElement.height = node.height;
		context.drawImage( node, 0, 0 );
		return canvasElement.toDataURL( 'image/jpeg' );
	} );
}

describe( 'Image', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be inserted', async () => {
		await insertBlock( 'Image' );
		const filename = await upload( '.wp-block-image input[type="file"]' );
		await waitForImage( filename );

		const regex = new RegExp(
			`<!-- wp:image {"id":\\d+,"sizeSlug":"large","linkDestination":"none"} -->\\s*<figure class="wp-block-image size-large"><img src="[^"]+\\/${ filename }\\.png" alt="" class="wp-image-\\d+"/></figure>\\s*<!-- \\/wp:image -->`
		);
		expect( await getEditedPostContent() ).toMatch( regex );
	} );

	it( 'should replace, reset size, and keep selection', async () => {
		await insertBlock( 'Image' );
		const filename1 = await upload( '.wp-block-image input[type="file"]' );
		await waitForImage( filename1 );

		const regex1 = new RegExp(
			`<!-- wp:image {"id":\\d+,"sizeSlug":"large","linkDestination":"none"} -->\\s*<figure class="wp-block-image size-large"><img src="[^"]+\\/${ filename1 }\\.png" alt="" class="wp-image-\\d+"/></figure>\\s*<!-- \\/wp:image -->`
		);
		expect( await getEditedPostContent() ).toMatch( regex1 );

		await openDocumentSettingsSidebar();
		await page.click( '.block-editor-image-size-control__height' );
		await page.keyboard.press( 'Delete' );
		await page.keyboard.type( '5' );

		const regex2 = new RegExp(
			`<!-- wp:image {"id":\\d+,"height":50,"sizeSlug":"large","linkDestination":"none"} -->\\s*<figure class="wp-block-image size-large is-resized"><img src="[^"]+\\/${ filename1 }\\.png" alt="" class="wp-image-\\d+" height="50"\\/><\\/figure>\\s*<!-- /wp:image -->`
		);

		expect( await getEditedPostContent() ).toMatch( regex2 );

		await clickBlockToolbarButton( 'Replace', 'content' );
		const filename2 = await upload(
			'.block-editor-media-replace-flow__options input[type="file"]',
			page
		);
		await waitForImage( filename2 );

		const regex3 = new RegExp(
			`<!-- wp:image {"id":\\d+,"sizeSlug":"large","linkDestination":"none"} -->\\s*<figure class="wp-block-image size-large"><img src="[^"]+\\/${ filename2 }\\.png" alt="" class="wp-image-\\d+"/></figure>\\s*<!-- \\/wp:image -->`
		);
		expect( await getEditedPostContent() ).toMatch( regex3 );

		await canvas().click( '.wp-block-image img' );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toBe( '' );
	} );

	it( 'should place caret at end of caption after merging empty paragraph', async () => {
		await insertBlock( 'Image' );
		const fileName = await upload( '.wp-block-image input[type="file"]' );
		await waitForImage( fileName );
		await page.keyboard.type( '1' );
		await insertBlock( 'Paragraph' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '2' );

		expect(
			await canvas().evaluate( () => document.activeElement.innerHTML )
		).toBe( '12' );
	} );

	it( 'should allow soft line breaks in caption', async () => {
		await insertBlock( 'Image' );
		const fileName = await upload( '.wp-block-image input[type="file"]' );
		await waitForImage( fileName );
		await page.keyboard.type( '12' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Enter' );

		expect(
			await canvas().evaluate( () => document.activeElement.innerHTML )
		).toBe( '1<br data-rich-text-line-break="true">2' );
	} );

	it( 'should drag and drop files into media placeholder', async () => {
		await page.keyboard.press( 'Enter' );
		await insertBlock( 'Image' );

		// Confirm correct setup.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		const image = await canvas().$( '[data-type="core/image"]' );

		await image.evaluate( () => {
			const input = document.createElement( 'input' );
			input.type = 'file';
			input.id = 'wp-temp-test-input';
			document.body.appendChild( input );
		} );

		const fileName = await upload( '#wp-temp-test-input' );

		const paragraphRect = await image.boundingBox();
		const pX = paragraphRect.x + paragraphRect.width / 2;
		const pY = paragraphRect.y + paragraphRect.height / 3;

		await image.evaluate(
			( element, clientX, clientY ) => {
				const input = document.getElementById( 'wp-temp-test-input' );
				const dataTransfer = new DataTransfer();
				dataTransfer.items.add( input.files[ 0 ] );
				const event = new DragEvent( 'drop', {
					bubbles: true,
					clientX,
					clientY,
					dataTransfer,
				} );
				element.dispatchEvent( event );
			},
			pX,
			pY
		);

		await waitForImage( fileName );
	} );

	it( 'allows zooming using the crop tools', async () => {
		// Insert the block, upload a file and crop.
		await insertBlock( 'Image' );
		const filename = await upload( '.wp-block-image input[type="file"]' );
		await waitForImage( filename );

		// Assert that the image is initially unscaled and unedited.
		const initialImage = await canvas().$( '.wp-block-image img' );
		const initialImageSrc = await getSrc( initialImage );
		const initialImageDataURL = await getDataURL( initialImage );
		expect( initialImageDataURL ).toMatchSnapshot();

		// Zoom in to twice the amount using the zoom input.
		await clickBlockToolbarButton( 'Crop' );
		await clickBlockToolbarButton( 'Zoom' );
		await page.waitForFunction( () =>
			document.activeElement.classList.contains(
				'components-range-control__slider'
			)
		);
		await page.keyboard.press( 'Tab' );
		await page.waitForFunction( () =>
			document.activeElement.classList.contains(
				'components-input-control__input'
			)
		);
		await pressKeyWithModifier( 'primary', 'a' );
		await page.keyboard.type( '200' );
		await page.keyboard.press( 'Escape' );
		await clickBlockToolbarButton( 'Apply', 'content' );

		// Wait for the cropping tools to disappear.
		await canvas().waitForSelector(
			'.wp-block-image img:not( .reactEasyCrop_Image )'
		);

		// Assert that the image is edited.
		const updatedImage = await canvas().$( '.wp-block-image img' );
		const updatedImageSrc = await getSrc( updatedImage );
		expect( initialImageSrc ).not.toEqual( updatedImageSrc );
		const updatedImageDataURL = await getDataURL( updatedImage );
		expect( initialImageDataURL ).not.toEqual( updatedImageDataURL );
		expect( updatedImageDataURL ).toMatchSnapshot();
	} );

	it( 'allows changing aspect ratio using the crop tools', async () => {
		// Insert the block, upload a file and crop.
		await insertBlock( 'Image' );
		const filename = await upload( '.wp-block-image input[type="file"]' );
		await waitForImage( filename );

		// Assert that the image is initially unscaled and unedited.
		const initialImage = await canvas().$( '.wp-block-image img' );
		const initialImageSrc = await getSrc( initialImage );
		const initialImageDataURL = await getDataURL( initialImage );
		expect( initialImageDataURL ).toMatchSnapshot();

		// Zoom in to twice the amount using the zoom input.
		await clickBlockToolbarButton( 'Crop' );
		await clickBlockToolbarButton( 'Aspect Ratio' );
		await page.waitForFunction( () =>
			document.activeElement.classList.contains(
				'components-menu-item__button'
			)
		);
		await clickMenuItem( '16:10' );
		await clickBlockToolbarButton( 'Apply', 'content' );

		// Wait for the cropping tools to disappear.
		await canvas().waitForSelector(
			'.wp-block-image img:not( .reactEasyCrop_Image )'
		);

		// Assert that the image is edited.
		const updatedImage = await canvas().$( '.wp-block-image img' );
		const updatedImageSrc = await getSrc( updatedImage );
		expect( initialImageSrc ).not.toEqual( updatedImageSrc );
		const updatedImageDataURL = await getDataURL( updatedImage );
		expect( initialImageDataURL ).not.toEqual( updatedImageDataURL );
		expect( updatedImageDataURL ).toMatchSnapshot();
	} );

	it( 'allows rotating using the crop tools', async () => {
		// Insert the block, upload a file and crop.
		await insertBlock( 'Image' );
		const filename = await upload( '.wp-block-image input[type="file"]' );
		await waitForImage( filename );

		// Assert that the image is initially unscaled and unedited.
		const initialImage = await canvas().$( '.wp-block-image img' );
		const initialImageDataURL = await getDataURL( initialImage );
		expect( initialImageDataURL ).toMatchSnapshot();

		// Double the image's size using the zoom input.
		await clickBlockToolbarButton( 'Crop' );
		await canvas().waitForSelector(
			'.wp-block-image img.reactEasyCrop_Image'
		);
		await clickBlockToolbarButton( 'Rotate' );
		await clickBlockToolbarButton( 'Apply', 'content' );

		await canvas().waitForSelector(
			'.wp-block-image img:not( .reactEasyCrop_Image )'
		);

		// Assert that the image is edited.
		const updatedImage = await canvas().$( '.wp-block-image img' );
		const updatedImageDataURL = await getDataURL( updatedImage );
		expect( initialImageDataURL ).not.toEqual( updatedImageDataURL );
		expect( updatedImageDataURL ).toMatchSnapshot();
	} );
} );
