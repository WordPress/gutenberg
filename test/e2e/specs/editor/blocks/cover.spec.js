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
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function getTestImage() {
	const testImagePath = path.join(
		__dirname,
		'..',
		'..',
		'..',
		'assets',
		'10x10_e2e_test_image_z9T8jK.png'
	);
	const filename = uuid();
	const tmpFilename = path.join( os.tmpdir(), filename + '.png' );
	fs.copyFileSync( testImagePath, tmpFilename );
	return tmpFilename;
}

test.describe( 'Cover', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can set overlay color using color picker on block placeholder', async ( {
		page,
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/cover' } );

		// Locate the first color option from the block placeholder's color picker.
		const firstColorPickerButton = page
			.locator( 'button.components-circular-option-picker__option' )
			.first();

		// Get the RGB value of the picked color.
		await expect( firstColorPickerButton ).toBeVisible();
		const pickedColor = await firstColorPickerButton.evaluate(
			( node ) => node.style.backgroundColor
		);

		// Create the block by clicking selected color button.
		await firstColorPickerButton.click();

		// Get the block's background dim element.
		const backgrounDimLocator = page.locator(
			'.wp-block-cover .has-background-dim'
		);
		await backgrounDimLocator.waitFor();
		// Get the RGB value of the background dim.
		const dimColor = await backgrounDimLocator.evaluate(
			( node ) => node.style.backgroundColor
		);

		expect( pickedColor ).toEqual( dimColor );
	} );

	test( 'can set background image using image upload on block placeholder', async ( {
		page,
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/cover' } );

		// Create a test image.
		const testImage = await getTestImage();

		// Create the block using uploaded image.
		await page
			.locator( `.wp-block-cover input[type="file"]` )
			.setInputFiles( testImage );

		const testImageFilename = path.basename( testImage );

		const backgroundImageLocator = page.locator(
			`.wp-block-cover img[src$="${ testImageFilename }"]`
		);

		// Get the block's background image URL.
		const backgroundImageURL = await backgroundImageLocator.evaluate(
			( el ) => el.src
		);
		expect( backgroundImageURL ).toContain( testImageFilename );
	} );

	test( 'dims background image down by 50% by default', async ( {
		page,
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/cover' } );

		// Create a test image.
		const testImage = await getTestImage();

		// Create the block using uploaded image.
		await page
			.locator( `.wp-block-cover input[type="file"]` )
			.setInputFiles( testImage );

		const [ backgroundDimColor, backgroundDimOpacity ] = await page
			.locator( '.wp-block-cover .has-background-dim' )
			.evaluate( ( el ) => {
				const computedStyle = window.getComputedStyle( el );
				return [ computedStyle.backgroundColor, computedStyle.opacity ];
			} );

		expect( backgroundDimColor ).toBe( 'rgb(0, 0, 0)' );
		expect( backgroundDimOpacity ).toBe( '0.5' );
	} );

	test( 'can have the title edited', async ( { page, editor } ) => {
		await editor.insertBlock( { name: 'core/cover' } );

		// Locate the first color option from the block placeholder's color picker.
		await page
			.locator( 'button.components-circular-option-picker__option' )
			.first()
			.click();

		// Click on the placeholder text to activate cursor inside.
		const coverTitle = page.locator( '[data-title="Paragraph"]' );
		await expect( coverTitle ).toBeVisible();
		await coverTitle.click();

		// Type the title.
		await page.keyboard.type( 'foo' );
		const coverTitleText = await coverTitle.innerText();

		expect( coverTitleText ).toEqual( 'foo' );
	} );

	test( 'can be resized using drag & drop', async ( { page, editor } ) => {
		await editor.insertBlock( { name: 'core/cover' } );

		// Open the document sidebar.
		await editor.openDocumentSettingsSidebar();

		// Locate the first color option from the block placeholder's color picker.
		await page
			.locator( 'button.components-circular-option-picker__option' )
			.first()
			.click();

		// Open the block list viewer and select child paragraph within the cover block.
		await page.locator( '[aria-label="List View"]' ).click();
		await page
			.locator(
				'[aria-label="Block navigation structure"] [aria-label="Cover link"]'
			)
			.click();

		const coverHeightInput = page.locator(
			'role=spinbutton[name="Minimum height of cover"]'
		);
		await expect( coverHeightInput ).not.toHaveValue( /[0-9]/ );

		const coverBlockBoundingBox = await page
			.locator( '[aria-label="Block: Cover"]' )
			.boundingBox();

		const boundingBoxResizeButton = await page
			.locator( '.components-resizable-box__handle-bottom' )
			.boundingBox();
		const coordinatesResizeButton = {
			x: boundingBoxResizeButton.x + boundingBoxResizeButton.width / 2,
			y: boundingBoxResizeButton.y + boundingBoxResizeButton.height / 2,
		};

		// Move the  mouse to the position of the resize button.
		await page.mouse.move(
			coordinatesResizeButton.x,
			coordinatesResizeButton.y
		);

		// Resize the block by at least 100px.
		await page
			.locator( '.components-resizable-box__handle-bottom' )
			.hover();
		await page.mouse.down();
		await page.mouse.move(
			coordinatesResizeButton.x,
			coordinatesResizeButton.y + 100,
			{ steps: 10 }
		);
		await page.mouse.up();

		const newCoverBlockBoundingBox = await page
			.locator( '[aria-label="Block: Cover"]' )
			.boundingBox();

		expect( newCoverBlockBoundingBox.height ).toBeGreaterThanOrEqual(
			coverBlockBoundingBox.height + 100
		);
		await expect( coverHeightInput ).toHaveValue(
			newCoverBlockBoundingBox.height.toString()
		);
	} );

	test( 'dims the background image down by 50% when transformed from the Image block', async ( {
		page,
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		// Upload image and transform to the Cover block.
		const testImage = await getTestImage();

		// Create the block using uploaded image.
		await page
			.locator( `.wp-block-image input[type="file"]` )
			.setInputFiles( testImage );

		await expect(
			page.locator(
				`.wp-block-image img[src$="${ path.basename( testImage ) }"]`
			)
		).toBeVisible();

		await page.locator( '.wp-block-image' ).focus();
		await editor.transformBlockTo( 'core/cover' );

		// Get the block's background dim color and its opacity.
		await expect(
			page.locator( '.wp-block-cover .has-background-dim' )
		).toBeEnabled();

		const [ backgroundDimColor, backgroundDimOpacity ] = await page
			.locator( '.wp-block-cover .has-background-dim' )
			.evaluate( ( el ) => {
				const computedStyle = window.getComputedStyle( el );
				return [ computedStyle.backgroundColor, computedStyle.opacity ];
			} );

		expect( backgroundDimColor ).toBe( 'rgb(0, 0, 0)' );
		expect( backgroundDimOpacity ).toBe( '0.5' );
	} );
} );
