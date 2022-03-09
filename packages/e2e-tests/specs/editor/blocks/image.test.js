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
	clickBlockToolbarButton,
	clickMenuItem,
	openDocumentSettingsSidebar,
	pressKeyWithModifier,
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
	return filename;
}

async function waitForImage( filename ) {
	await page.waitForSelector(
		`.wp-block-image img[src$="${ filename }.png"]`
	);
}

async function getSrc( elementHandle ) {
	return elementHandle.evaluate( ( node ) => node.src );
}
async function getDataURL( elementHandle ) {
	return elementHandle.evaluate( ( node ) => {
		const canvas = document.createElement( 'canvas' );
		const context = canvas.getContext( '2d' );
		canvas.width = node.width;
		canvas.height = node.height;
		context.drawImage( node, 0, 0 );
		return canvas.toDataURL( 'image/jpeg' );
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
			`<!-- wp:image {"id":\\d+,"sizeSlug":"full","linkDestination":"none"} -->\\s*<figure class="wp-block-image size-full"><img src="[^"]+\\/${ filename }\\.png" alt="" class="wp-image-\\d+"/></figure>\\s*<!-- \\/wp:image -->`
		);
		expect( await getEditedPostContent() ).toMatch( regex );
	} );

	it( 'should replace, reset size, and keep selection', async () => {
		await insertBlock( 'Image' );
		const filename1 = await upload( '.wp-block-image input[type="file"]' );
		await waitForImage( filename1 );

		const regex1 = new RegExp(
			`<!-- wp:image {"id":\\d+,"sizeSlug":"full","linkDestination":"none"} -->\\s*<figure class="wp-block-image size-full"><img src="[^"]+\\/${ filename1 }\\.png" alt="" class="wp-image-\\d+"/></figure>\\s*<!-- \\/wp:image -->`
		);
		expect( await getEditedPostContent() ).toMatch( regex1 );

		await openDocumentSettingsSidebar();
		await page.click( '[aria-label="Image size presets"] button' );

		const regex2 = new RegExp(
			`<!-- wp:image {"id":\\d+,"width":3,"height":3,"sizeSlug":"full","linkDestination":"none"} -->\\s*<figure class="wp-block-image size-full is-resized"><img src="[^"]+\\/${ filename1 }\\.png" alt="" class="wp-image-\\d+" width="3" height="3"\\/><\\/figure>\\s*<!-- /wp:image -->`
		);

		expect( await getEditedPostContent() ).toMatch( regex2 );

		await clickButton( 'Replace' );
		const filename2 = await upload(
			'.block-editor-media-replace-flow__options input[type="file"]'
		);
		await waitForImage( filename2 );

		const regex3 = new RegExp(
			`<!-- wp:image {"id":\\d+,"sizeSlug":"full","linkDestination":"none"} -->\\s*<figure class="wp-block-image size-full"><img src="[^"]+\\/${ filename2 }\\.png" alt="" class="wp-image-\\d+"/></figure>\\s*<!-- \\/wp:image -->`
		);
		expect( await getEditedPostContent() ).toMatch( regex3 );
		// Focus outside the block to avoid the image caption being selected
		// It can happen on CI specially.
		await page.click( '.wp-block-post-title' );
		await page.click( '.wp-block-image img' );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toBe( '' );
	} );

	it.skip( 'should place caret at end of caption after merging empty paragraph', async () => {
		await insertBlock( 'Image' );
		const fileName = await upload( '.wp-block-image input[type="file"]' );
		await waitForImage( fileName );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '2' );

		expect(
			await page.evaluate( () => document.activeElement.innerHTML )
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
			await page.evaluate( () => document.activeElement.innerHTML )
		).toBe( '1<br data-rich-text-line-break="true">2' );
	} );

	it( 'should have keyboard navigable toolbar for caption', async () => {
		await insertBlock( 'Image' );
		const fileName = await upload( '.wp-block-image input[type="file"]' );
		await waitForImage( fileName );
		// Navigate to More, Link, Italic and finally Bold.
		await pressKeyWithModifier( 'shift', 'Tab' );
		await pressKeyWithModifier( 'shift', 'Tab' );
		await pressKeyWithModifier( 'shift', 'Tab' );
		await pressKeyWithModifier( 'shift', 'Tab' );
		await page.keyboard.press( 'Space' );
		await page.keyboard.press( 'a' );
		await page.keyboard.press( 'ArrowRight' );

		expect(
			await page.evaluate( () => document.activeElement.innerHTML )
		).toBe( '<strong>a</strong>' );
	} );

	it( 'should drag and drop files into media placeholder', async () => {
		await page.keyboard.press( 'Enter' );
		await insertBlock( 'Image' );

		// Confirm correct setup.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		const image = await page.$( '[data-type="core/image"]' );

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
		const initialImage = await page.$( '.wp-block-image img' );
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
		await page.waitForSelector(
			'.wp-block-image img:not( .reactEasyCrop_Image )'
		);

		// Assert that the image is edited.
		const updatedImage = await page.$( '.wp-block-image img' );
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
		const initialImage = await page.$( '.wp-block-image img' );
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
		await page.waitForSelector(
			'.wp-block-image img:not( .reactEasyCrop_Image )'
		);

		// Assert that the image is edited.
		const updatedImage = await page.$( '.wp-block-image img' );
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
		const initialImage = await page.$( '.wp-block-image img' );
		const initialImageDataURL = await getDataURL( initialImage );
		expect( initialImageDataURL ).toMatchSnapshot();

		// Double the image's size using the zoom input.
		await clickBlockToolbarButton( 'Crop' );
		await page.waitForSelector( '.wp-block-image img.reactEasyCrop_Image' );
		await clickBlockToolbarButton( 'Rotate' );
		await clickBlockToolbarButton( 'Apply', 'content' );

		await page.waitForSelector(
			'.wp-block-image img:not( .reactEasyCrop_Image )'
		);

		// Assert that the image is edited.
		const updatedImage = await page.$( '.wp-block-image img' );
		const updatedImageDataURL = await getDataURL( updatedImage );
		expect( initialImageDataURL ).not.toEqual( updatedImageDataURL );
		expect( updatedImageDataURL ).toMatchSnapshot();
	} );

	it( 'Should reset dimensions on change URL', async () => {
		const imageUrl = '/wp-includes/images/w-logo-blue.png';

		await insertBlock( 'Image' );

		// Upload an initial image.
		const filename = await upload( '.wp-block-image input[type="file"]' );
		await waitForImage( filename );
		// Resize the Uploaded Image.
		await openDocumentSettingsSidebar();
		await page.waitForSelector(
			'[aria-label="Image size presets"] button:first-child',
			{ visible: true }
		);
		await page.click(
			'[aria-label="Image size presets"] button:first-child'
		);

		const regexBefore = new RegExp(
			`<!-- wp:image {"id":\\d+,"width":3,"height":3,"sizeSlug":"full","linkDestination":"none"} -->\\s*<figure class="wp-block-image size-full is-resized"><img src="[^"]+\\/${ filename }\\.png" alt="" class="wp-image-\\d+" width="3" height="3"\\/><\\/figure>\\s*<!-- /wp:image -->`
		);

		// Check if dimensions are changed.
		expect( await getEditedPostContent() ).toMatch( regexBefore );

		// Replace uploaded image with an URL.
		await clickButton( 'Replace' );

		const [ editButton ] = await page.$x(
			'//button[contains(@aria-label, "Edit")]'
		);
		await editButton.click();

		await page.waitForSelector( '.block-editor-url-input__input' );

		// Clear the input field. Delay added to account for typing delays.
		const inputField = await page.$( '.block-editor-url-input__input' );
		await inputField.click( { clickCount: 3, delay: 200 } );

		// Replace the url. Delay added to account for typing delays.
		await page.focus( '.block-editor-url-input__input' );
		await page.keyboard.type( imageUrl, { delay: 100 } );
		await page.click( '.block-editor-link-control__search-submit' );

		const regexAfter = new RegExp(
			`<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->\\s*<figure class="wp-block-image size-large"><img src="${ imageUrl }" alt=""/></figure>\\s*<!-- /wp:image -->`
		);

		// Check if dimensions are reset.
		expect( await getEditedPostContent() ).toMatch( regexAfter );
	} );

	it( 'should undo without broken temporary state', async () => {
		await insertBlock( 'Image' );
		const fileName = await upload( '.wp-block-image input[type="file"]' );
		await waitForImage( fileName );
		await pressKeyWithModifier( 'primary', 'z' );
		// Expect an empty image block (placeholder) rather than one with a
		// broken temporary URL.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
