/**
 * External dependencies
 */
import path from 'path';
const fs = require( 'fs/promises' );
import os from 'os';
import { v4 as uuid } from 'uuid';

/** @typedef {import('@playwright/test').Page} Page */

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	imageBlockUtils: async ( { page }, use ) => {
		await use( new ImageBlockUtils( { page } ) );
	},
} );

async function getBackgroundColorAndOpacity( locator ) {
	return await locator.evaluate( ( el ) => {
		const computedStyle = window.getComputedStyle( el );
		return [ computedStyle.backgroundColor, computedStyle.opacity ];
	} );
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

		// Locate the Black color swatch.
		const blackColorSwatch = page.getByRole( 'button', {
			name: 'Color: Black',
		} );
		await expect( blackColorSwatch ).toBeVisible();

		// Get the RGB value of Black.
		const blackRGB = await blackColorSwatch.evaluate(
			( node ) => node.style.backgroundColor
		);

		// Create the block by clicking selected color button.
		await blackColorSwatch.click();

		// Get the RGB value of the background dim.
		// The span element implements the colored background.
		const backgrounDimLocator = page
			.getByRole( 'document', { name: 'Block: Cover' } )
			.locator( 'span[aria-hidden="true"]' );
		const actualRGB = await backgrounDimLocator.evaluate(
			( node ) => node.style.backgroundColor
		);

		expect( blackRGB ).toEqual( actualRGB );
	} );

	test( 'can set background image using image upload on block placeholder', async ( {
		page,
		editor,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/cover' } );

		const coverBlock = page.getByRole( 'document', {
			name: 'Block: Cover',
		} );

		const filename = await imageBlockUtils.upload(
			coverBlock.getByTestId( 'form-file-upload-input' )
		);
		const fileBasename = path.basename( filename );

		// Wait for the img's src attribute to be prefixed with http.
		// Otherwise, the URL for the img src attribute is that of a placeholder.
		await coverBlock.locator( `img[src^=http]` ).waitFor();

		const backgroundImageURL = await coverBlock
			.locator( 'img' )
			.getAttribute( 'src' );

		expect( backgroundImageURL ).toContain( fileBasename );
	} );

	test( 'dims background image down by 50% by default', async ( {
		page,
		editor,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/cover' } );

		const coverBlock = page.getByRole( 'document', {
			name: 'Block: Cover',
		} );

		await imageBlockUtils.upload(
			coverBlock.getByTestId( 'form-file-upload-input' )
		);

		const [ backgroundDimColor, backgroundDimOpacity ] =
			await getBackgroundColorAndOpacity(
				coverBlock.locator( 'span[aria-hidden="true"]' )
			);
		expect( backgroundDimColor ).toBe( 'rgb(0, 0, 0)' );
		expect( backgroundDimOpacity ).toBe( '0.5' );
	} );

	test( 'can have the title edited', async ( { page, editor } ) => {
		const titleText = 'foo';

		await editor.insertBlock( { name: 'core/cover' } );

		// Choose a color swatch to transform the placeholder block into
		// a functioning block.
		await page
			.getByRole( 'button', {
				name: 'Color: Black',
			} )
			.click();

		// Activate the paragraph block inside the Cover block.
		// The name of the block differs depending on whether text has been entered or not.
		const coverParagraphLocator = page.getByRole( 'document', {
			name: /Paragraph block|Empty block; start writing or type forward slash to choose a block/,
		} );
		await expect( coverParagraphLocator ).toBeEditable();

		await coverParagraphLocator.fill( titleText );

		await expect( coverParagraphLocator ).toContainText( titleText );
	} );

	test( 'can be resized using drag & drop', async ( { page, editor } ) => {
		await editor.insertBlock( { name: 'core/cover' } );

		// Open the document sidebar.
		await editor.openDocumentSettingsSidebar();

		await page
			.getByRole( 'button', {
				name: 'Color: Black',
			} )
			.click();

		// Open the block list viewer from the toolbar.
		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Document Overview' } )
			.click();

		// Select the Cover block from the docuemnt overview.
		await page.getByRole( 'link', { name: 'Cover' } ).click();

		// Ensure there the default value for the minimum height of cover is undefined.
		await page.getByRole( 'tab', { name: 'Styles' } ).click();
		const defaultHeightValue = await page
			.getByLabel( 'Minimum height of cover' )
			.inputValue();
		expect( defaultHeightValue ).toBeFalsy();

		// Establish locators for the Cover block and the resize handler.
		const coverBlock = page.getByRole( 'document', {
			name: 'Block: Cover',
		} );
		// There is no accessible locator for this element, which is a
		// bottom edge of the Cover block for resizing.
		const coverBlockResizeHandle = page.locator(
			'.components-resizable-box__handle-bottom'
		);

		// Establish the existing bounding boxes for the Cover block.
		const coverBlockBox = await coverBlock.boundingBox();

		expect( coverBlockBox.height ).toEqual( 450 );

		// Resize the block by 100px.
		await coverBlockResizeHandle.hover();
		await page.mouse.down();
		await page.mouse.move(
			coverBlockBox.x,
			coverBlockBox.y + coverBlockBox.height + 100,
			{ steps: 5 }
		);
		await page.mouse.up();

		const newCoverBlockBox = await coverBlock.boundingBox();
		expect( newCoverBlockBox.height ).toBeGreaterThanOrEqual(
			coverBlockBox.height + 100
		);
	} );

	test.only( 'dims the background image down by 50% when transformed from the Image block', async ( {
		page,
		editor,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = page.getByRole( 'document', {
			name: 'Block: Image',
		} );

		await imageBlockUtils.upload(
			imageBlock.getByTestId( 'form-file-upload-input' )
		);

		await expect(
			page
				.getByRole( 'document', { name: 'Block: Image' } )
				.locator( 'img' )
		).toBeVisible();

		await editor.transformBlockTo( 'core/cover' );

		const coverBlockBackground = page
			.getByRole( 'document', {
				name: 'Block: Cover',
			} )
			.locator( 'span[aria-hidden="true"]' );

		await expect( coverBlockBackground ).toBeVisible();

		const [ backgroundDimColor, backgroundDimOpacity ] =
			await getBackgroundColorAndOpacity( coverBlockBackground );

		expect( backgroundDimColor ).toBe( 'rgb(0, 0, 0)' );
		expect( backgroundDimOpacity ).toBe( '0.5' );
	} );
} );

class ImageBlockUtils {
	constructor( { page } ) {
		/** @type {Page} */
		this.page = page;

		this.TEST_IMAGE_FILE_PATH = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'assets',
			'10x10_e2e_test_image_z9T8jK.png'
		);
	}

	async upload( inputElement ) {
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-image-' )
		);
		const filename = uuid();
		const tmpFileName = path.join( tmpDirectory, filename + '.png' );
		await fs.copyFile( this.TEST_IMAGE_FILE_PATH, tmpFileName );

		await inputElement.setInputFiles( tmpFileName );

		return filename;
	}
}
