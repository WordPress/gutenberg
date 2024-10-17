/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs/promises' );
const os = require( 'os' );
const { v4: uuid } = require( 'uuid' );

/** @typedef {import('@playwright/test').Page} Page */

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	coverBlockUtils: async ( { page }, use ) => {
		await use( new CoverBlockUtils( { page } ) );
	},
} );

test.describe( 'Cover', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can set overlay color using color picker on block placeholder', async ( {
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/cover' } );
		const coverBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Cover',
		} );

		// Locate the Black color swatch.
		const blackColorSwatch = coverBlock.getByRole( 'option', {
			name: 'Color: Black',
		} );
		await expect( blackColorSwatch ).toBeVisible();

		// Create the block by clicking selected color button.
		await blackColorSwatch.click();

		// Assert that after clicking black, the background color is black.
		await expect( coverBlock ).toHaveCSS(
			'background-color',
			'rgb(0, 0, 0)'
		);
	} );

	test( 'can set background image using image upload on block placeholder', async ( {
		editor,
		coverBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/cover' } );
		const coverBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Cover',
		} );

		const filename = await coverBlockUtils.upload(
			coverBlock.getByTestId( 'form-file-upload-input' )
		);
		const fileBasename = path.basename( filename );

		// Wait for the img's src attribute to be prefixed with http.
		// Otherwise, the URL for the img src attribute starts is a placeholder
		// beginning with `blob`.
		await expect( async () => {
			const src = await coverBlock.locator( 'img' ).getAttribute( 'src' );
			expect( src.includes( fileBasename ) ).toBe( true );
		} ).toPass();
	} );

	test( 'dims background image down by 50% with the average image color when an image is uploaded', async ( {
		editor,
		coverBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/cover' } );
		const coverBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Cover',
		} );

		await coverBlockUtils.upload(
			coverBlock.getByTestId( 'form-file-upload-input' )
		);

		// The overlay is a separate aria-hidden span before the image.
		const overlay = coverBlock.locator( '.wp-block-cover__background' );

		await expect( overlay ).toHaveCSS(
			'background-color',
			'rgb(179, 179, 179)'
		);
		await expect( overlay ).toHaveCSS( 'opacity', '0.5' );
	} );

	test( 'can have the title edited', async ( { editor } ) => {
		const titleText = 'foo';

		await editor.insertBlock( { name: 'core/cover' } );
		const coverBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Cover',
		} );

		// Choose a color swatch to transform the placeholder block into
		// a functioning block.
		await coverBlock
			.getByRole( 'option', {
				name: 'Color: Black',
			} )
			.click();

		// Activate the paragraph block inside the Cover block.
		// The name of the block differs depending on whether text has been entered or not.
		const coverBlockParagraph = coverBlock.getByRole( 'document', {
			name: /Block: Paragraph|Empty block; start writing or type forward slash to choose a block/,
		} );
		await expect( coverBlockParagraph ).toBeEditable();

		await coverBlockParagraph.fill( titleText );

		await expect( coverBlockParagraph ).toContainText( titleText );
	} );

	test( 'can be resized using drag & drop', async ( { page, editor } ) => {
		await editor.insertBlock( { name: 'core/cover' } );
		const coverBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Cover',
		} );
		await coverBlock
			.getByRole( 'option', {
				name: 'Color: Black',
			} )
			.click();

		// Open the document sidebar.
		await editor.openDocumentSettingsSidebar();

		// Open the block list viewer from the Editor toolbar.
		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Document Overview' } )
			.click();

		// Select the Cover block from the Document Overview.
		await page
			.getByRole( 'region', { name: 'Document Overview' } )
			.getByRole( 'link', { name: 'Cover' } )
			.click();

		// In the Block Editor Settings panel, click on the Styles subpanel.
		const coverBlockEditorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await coverBlockEditorSettings
			.getByRole( 'tab', { name: 'Styles' } )
			.click();

		// Ensure there the default value for the minimum height of cover is undefined.
		const defaultHeightValue = await coverBlockEditorSettings
			.getByLabel( 'Minimum height' )
			.inputValue();
		expect( defaultHeightValue ).toBeFalsy();

		// There is no accessible locator for the draggable block resize edge,
		// which is he bottom edge of the Cover block.
		// Therefore a CSS selector must be used.
		const coverBlockResizeHandle = page.locator(
			'.components-resizable-box__handle-bottom'
		);

		// Establish the existing bounding boxes for the Cover block
		// and the Cover block's resizing handle.
		const coverBlockBox = await coverBlock.boundingBox();
		const coverBlockResizeHandleBox =
			await coverBlockResizeHandle.boundingBox();
		expect( coverBlockBox.height ).toBeTruthy();
		expect( coverBlockResizeHandleBox.height ).toBeTruthy();

		// Increse the Cover block height by 100px.
		await coverBlockResizeHandle.hover();
		await page.mouse.down();

		// Counter-intuitively, the mouse movement calculation should not be made using the
		// Cover block's bounding box, but rather based on the coordinates of the
		// resize handle.
		await page.mouse.move(
			coverBlockResizeHandleBox.x + coverBlockResizeHandleBox.width / 2,
			coverBlockResizeHandleBox.y + 100
		);
		await page.mouse.up();

		const newCoverBlockBox = await coverBlock.boundingBox();
		expect( newCoverBlockBox.height ).toBe( coverBlockBox.height + 100 );
	} );

	test( 'dims the background image down by 50% black when transformed from the Image block', async ( {
		editor,
		coverBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );

		await coverBlockUtils.upload(
			imageBlock.getByTestId( 'form-file-upload-input' )
		);

		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Image' } )
				.locator( 'img' )
		).toBeVisible();

		await editor.transformBlockTo( 'core/cover' );

		const coverBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Cover',
		} );

		// The overlay is a separate aria-hidden span before the image.
		const overlay = coverBlock.locator( '.wp-block-cover__background' );

		await expect( overlay ).toHaveCSS( 'background-color', 'rgb(0, 0, 0)' );
		await expect( overlay ).toHaveCSS( 'opacity', '0.5' );
	} );

	test( 'other cover blocks are not over the navigation block when the menu is open', async ( {
		editor,
		page,
	} ) => {
		// Insert a Cover block
		await editor.insertBlock( { name: 'core/cover' } );
		const coverBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Cover',
		} );

		// Choose a color swatch to transform the placeholder block into
		// a functioning block.
		await coverBlock
			.getByRole( 'option', {
				name: 'Color: Black',
			} )
			.click();

		// Insert a Navigation block inside the Cover block
		await editor.selectBlocks( coverBlock );
		await coverBlock.getByRole( 'button', { name: 'Add block' } ).click();
		await page.keyboard.type( 'Navigation' );
		const blockResults = page.getByRole( 'listbox', {
			name: 'Blocks',
		} );
		const blockResultOptions = blockResults.getByRole( 'option' );
		await blockResultOptions.nth( 0 ).click();

		// Insert a second Cover block.
		await editor.insertBlock( { name: 'core/cover' } );
		const secondCoverBlock = editor.canvas
			.getByRole( 'document', {
				name: 'Block: Cover',
			} )
			.last();

		// Choose a color swatch to transform the placeholder block into
		// a functioning block.
		await secondCoverBlock
			.getByRole( 'option', {
				name: 'Color: Black',
			} )
			.click();

		// Set the viewport to a small screen and open menu.
		await page.setViewportSize( { width: 375, height: 1000 } );
		const navigationBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Navigation',
		} );
		await editor.selectBlocks( navigationBlock );
		await editor.canvas
			.getByRole( 'button', { name: 'Open menu' } )
			.click();

		// Check if inner container of the second cover is clickable.
		const secondInnerContainer = secondCoverBlock.locator(
			'.wp-block-cover__inner-container'
		);
		let isClickable;
		try {
			isClickable = await secondInnerContainer.click( {
				trial: true,
				timeout: 1000, // This test will always take 1 second to run.
			} );
		} catch ( error ) {
			isClickable = false;
		}

		expect( isClickable ).toBe( false );
	} );
} );

class CoverBlockUtils {
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

	async upload( locator ) {
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-image-' )
		);
		const filename = uuid();
		const tmpFileName = path.join( tmpDirectory, filename + '.png' );
		await fs.copyFile( this.TEST_IMAGE_FILE_PATH, tmpFileName );

		await locator.setInputFiles( tmpFileName );

		return filename;
	}
}
