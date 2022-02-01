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
	createNewPost,
	openDocumentSettingsSidebar,
	transformBlockTo,
} from '@wordpress/e2e-test-utils';

async function upload( selector ) {
	const inputElement = await page.waitForSelector(
		`${ selector } input[type="file"]`
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
	await page.waitForSelector( `${ selector } img[src$="${ filename }.png"]` );
	return filename;
}

describe( 'Cover', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can set overlay color using color picker on block placeholder', async () => {
		await insertBlock( 'Cover' );
		// Get the first color option from the block placeholder's color picker
		const colorPickerButton = await page.waitForSelector(
			'.wp-block-cover__placeholder-background-options .components-circular-option-picker__option-wrapper:first-child button'
		);
		// Get the RGB value of the picked color
		const pickedColor = await colorPickerButton.evaluate(
			( node ) => node.style.backgroundColor
		);
		// Create the block by clicking selected color button
		await colorPickerButton.click();
		// Get the block's background dim element
		const backgroundDim = await page.waitForSelector(
			'.wp-block-cover .has-background-dim'
		);
		// Get the RGB value of the background dim
		const dimColor = await backgroundDim.evaluate(
			( node ) => node.style.backgroundColor
		);

		expect( pickedColor ).toEqual( dimColor );
	} );

	it( 'can set background image using image upload on block placeholder', async () => {
		await insertBlock( 'Cover' );
		// Create the block using uploaded image
		const sourceImageFilename = await upload( '.wp-block-cover' );
		// Get the block's background image URL
		const blockImage = await page.waitForSelector( '.wp-block-cover img' );
		const blockImageUrl = await blockImage.evaluate( ( el ) => el.src );

		expect( blockImageUrl ).toContain( sourceImageFilename );
	} );

	it( 'dims background image down by 50% by default', async () => {
		await insertBlock( 'Cover' );
		// Create the block using uploaded image
		await upload( '.wp-block-cover' );
		// Get the block's background dim color and its opacity
		const backgroundDim = await page.waitForSelector(
			'.wp-block-cover .has-background-dim'
		);
		const [
			backgroundDimColor,
			backgroundDimOpacity,
		] = await page.evaluate( ( el ) => {
			const computedStyle = window.getComputedStyle( el );
			return [ computedStyle.backgroundColor, computedStyle.opacity ];
		}, backgroundDim );

		expect( backgroundDimColor ).toBe( 'rgb(0, 0, 0)' );
		expect( backgroundDimOpacity ).toBe( '0.5' );
	} );

	it( 'can have the title edited', async () => {
		await insertBlock( 'Cover' );
		// Click first color option from the block placeholder's color picker
		const colorPickerButton = await page.waitForSelector(
			'.wp-block-cover__placeholder-background-options .components-circular-option-picker__option-wrapper:first-child button'
		);
		await colorPickerButton.click();
		// Click the title placeholder to put the cursor inside
		const coverTitle = await page.waitForSelector(
			'.wp-block-cover .wp-block-paragraph'
		);
		await coverTitle.click();
		// Type the title
		await page.keyboard.type( 'foo' );
		const coverTitleText = await coverTitle.evaluate(
			( el ) => el.innerText
		);

		expect( coverTitleText ).toEqual( 'foo' );
	} );

	it( 'can be resized using drag & drop', async () => {
		await insertBlock( 'Cover' );
		// Close the inserter
		await page.click( '.edit-post-header-toolbar__inserter-toggle' );
		// Open the sidebar
		await openDocumentSettingsSidebar();
		// Choose the first solid color as the background of the cover.
		await page.click(
			'.components-circular-option-picker__option-wrapper:first-child button'
		);

		// Select the cover block.By default the child paragraph gets selected.
		await page.click( '.edit-post-header-toolbar__list-view-toggle' );
		await page.click(
			'.block-editor-list-view-block__contents-container a'
		);

		const heightInput = (
			await page.$x(
				'//div[./label[contains(text(),"Minimum height of cover")]]//input'
			)
		 )[ 0 ];

		// Verify the height of the cover is not defined
		expect(
			await page.evaluate( ( { value } ) => value, heightInput )
		).toBeFalsy();

		const resizeButton = await page.$(
			'.components-resizable-box__handle-bottom'
		);
		const boundingBoxResizeButton = await resizeButton.boundingBox();
		const coordinatesResizeButton = {
			x: boundingBoxResizeButton.x + boundingBoxResizeButton.width / 2,
			y: boundingBoxResizeButton.y + boundingBoxResizeButton.height / 2,
		};

		// Move the  mouse to the position of the resize button.
		await page.mouse.move(
			coordinatesResizeButton.x,
			coordinatesResizeButton.y
		);

		// Trigger a mousedown event against the resize button.
		// Using page.mouse.down does not works because it triggers a global event,
		// not an event for that element.
		page.evaluate( ( { x, y } ) => {
			const element = document.querySelector(
				'.components-resizable-box__handle-bottom'
			);
			event = document.createEvent( 'CustomEvent' );
			event.initCustomEvent( 'mousedown', true, true, null );
			event.clientX = x;
			event.clientY = y;
			element.dispatchEvent( event );
		}, coordinatesResizeButton );

		// Move the mouse to resize the cover.
		await page.mouse.move(
			coordinatesResizeButton.x,
			coordinatesResizeButton.y + 100,
			{ steps: 10 }
		);

		// Release the mouse.
		await page.mouse.up();

		// Verify the height of the cover has changed.
		expect(
			await page.evaluate(
				( { value } ) => Number.parseInt( value ),
				heightInput
			)
		).toBeGreaterThan( 100 );
	} );

	it( 'dims the background image down by 50% when transformed from the Image block', async () => {
		await insertBlock( 'Image' );
		// Upload image and transform to the Cover block
		const filename = await upload( '.wp-block-image' );
		await page.waitForSelector(
			`.wp-block-image img[src$="${ filename }.png"]`
		);

		// Click the block wrapper before trying to convert to make sure figcaption toolbar is not obscuring
		// the block toolbar.
		await page.click( '.wp-block-image' );
		await transformBlockTo( 'Cover' );

		// Get the block's background dim color and its opacity
		const backgroundDim = await page.waitForSelector(
			'.wp-block-cover .has-background-dim'
		);
		const [
			backgroundDimColor,
			backgroundDimOpacity,
		] = await page.evaluate( ( el ) => {
			const computedStyle = window.getComputedStyle( el );
			return [ computedStyle.backgroundColor, computedStyle.opacity ];
		}, backgroundDim );

		expect( backgroundDimColor ).toBe( 'rgb(0, 0, 0)' );
		expect( backgroundDimOpacity ).toBe( '0.5' );
	} );
} );
