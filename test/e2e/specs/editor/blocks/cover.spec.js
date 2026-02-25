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

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'can set overlay color using color picker on block placeholder', async ( {
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/cover' } );
		const coverBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Cover',
		} );

		// Locate the Black color swatch.
		const blackColorSwatch = coverBlock.getByRole( 'button', {
			name: 'Black',
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

	test( 'computes overlay color correctly for uploaded image', async ( {
		editor,
		page,
		coverBlockUtils,
	} ) => {
		let coverBlock;

		await test.step( 'can set background image using image upload on block placeholder', async () => {
			await editor.insertBlock( { name: 'core/cover' } );
			coverBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Cover',
			} );

			const fileName = await coverBlockUtils.upload(
				coverBlock.getByTestId( 'form-file-upload-input' )
			);
			const fileBasename = path.basename( fileName );

			// Wait for the img's src attribute to be prefixed with http.
			// Otherwise, the URL for the img src attribute starts is a placeholder
			// beginning with `blob`.
			await expect( async () => {
				const src = await coverBlock
					.locator( 'img' )
					.getAttribute( 'src' );
				expect( src.includes( fileBasename ) ).toBe( true );
			} ).toPass();
		} );

		await test.step( 'dims background image down by 50% with the average image color when an image is uploaded', async () => {
			// The overlay is a separate aria-hidden span before the image.
			const overlay = coverBlock.locator( '.wp-block-cover__background' );

			await expect( overlay ).toHaveCSS(
				'background-color',
				'rgb(179, 179, 179)'
			);
			await expect( overlay ).toHaveCSS( 'opacity', '0.5' );
		} );

		await test.step( 'auto-updates overlay color when replacing image after save and reload', async () => {
			// Save and reload.
			await editor.saveDraft();
			await page.reload();

			// Replace the image with a green one.
			coverBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Cover',
			} );
			await expect( coverBlock ).toBeVisible();
			await editor.selectBlocks( coverBlock );
			await editor.showBlockToolbar();

			await page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Replace' } )
				.click();

			const replaceInput = page.getByTestId( 'form-file-upload-input' );
			await coverBlockUtils.upload(
				replaceInput,
				coverBlockUtils.GREEN_IMAGE_FILE_PATH
			);
			await expect( coverBlock.locator( 'img' ) ).toBeVisible();

			// The overlay should have auto-updated to the green image's average
			// color — no longer the gray from the first image.
			// This is the regression from PR #65105 / issue #64702.
			const overlay = coverBlock.locator( '.wp-block-cover__background' );
			await expect( overlay ).toHaveCSS(
				'background-color',
				'rgb(179, 255, 179)'
			);
		} );

		await test.step( 'should not auto-update a manually set overlay color when replacing image after save and reload', async () => {
			// Manually change the overlay color to blue.
			await editor.selectBlocks( coverBlock );
			await editor.openDocumentSettingsSidebar();
			const editorSettings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			await editorSettings.getByRole( 'tab', { name: 'Styles' } ).click();
			await editorSettings
				.getByRole( 'button', { name: 'Overlay' } )
				.click();
			await page
				.getByRole( 'button', { name: 'Custom color picker' } )
				.click();
			await page
				.getByRole( 'textbox', { name: 'Hex color' } )
				.fill( '0000ff' );

			const overlay = coverBlock.locator( '.wp-block-cover__background' );
			await expect( overlay ).toHaveCSS(
				'background-color',
				'rgb(0, 0, 255)'
			);

			// Replace the image again with the original black-and-white one.
			// Because the user explicitly set the overlay color, it should NOT
			// be auto-detected from the new image.
			await editor.selectBlocks( coverBlock );
			await editor.showBlockToolbar();

			await page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Replace' } )
				.click();

			const secondReplaceInput = page.getByTestId(
				'form-file-upload-input'
			);
			await coverBlockUtils.upload( secondReplaceInput );
			await expect( coverBlock.locator( 'img' ) ).toBeVisible();

			// The overlay should still be blue — the user's manual choice is
			// preserved even after replacing the image.
			await expect( overlay ).toHaveCSS(
				'background-color',
				'rgb(0, 0, 255)'
			);
		} );
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
			.getByRole( 'button', {
				name: 'Black',
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
			.getByRole( 'button', {
				name: 'Black',
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

		// Increase the Cover block height by 100px.
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
			.getByRole( 'button', {
				name: 'Black',
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
			.getByRole( 'button', {
				name: 'Black',
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

	test( 'can use focal point picker to set the focal point of the cover image', async ( {
		editor,
		coverBlockUtils,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/cover' } );
		const coverBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Cover',
		} );

		await coverBlockUtils.upload(
			coverBlock.getByTestId( 'form-file-upload-input' )
		);

		await editor.selectBlocks( coverBlock );

		const focalPointLeft = page.getByRole( 'spinbutton', {
			name: 'Focal point left position',
		} );

		const focalPointTop = page.getByRole( 'spinbutton', {
			name: 'Focal point top position',
		} );

		await focalPointLeft.fill( '20' );
		await focalPointTop.fill( '30' );

		await expect( focalPointLeft ).toHaveValue( '20' );
		await expect( focalPointTop ).toHaveValue( '30' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/cover',
				attributes: {
					focalPoint: { x: 0.2, y: 0.3 },
				},
			},
		] );

		const coverImage = coverBlock.locator(
			'img.wp-block-cover__image-background'
		);

		await expect( coverImage ).toHaveCSS( 'object-position', '20% 30%' );
	} );

	test( 'correctly computes isDark based on dimRatio and overlay color', async ( {
		page,
		editor,
	} ) => {
		// A cover with a black overlay at 100% should be dark.
		await editor.insertBlock( { name: 'core/cover' } );
		const coverBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Cover',
		} );
		await coverBlock
			.getByRole( 'button', {
				name: 'Black',
			} )
			.click();

		// Black overlay at default 100% opacity → dark theme.
		await expect( coverBlock ).toHaveClass( /is-dark-theme/ );

		// Select the Cover block (not the inner Paragraph) before opening sidebar.
		await editor.selectBlocks( coverBlock );

		// Open sidebar and set overlay opacity to 0.
		await editor.openDocumentSettingsSidebar();
		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await editorSettings.getByRole( 'tab', { name: 'Styles' } ).click();

		const opacitySlider = editorSettings.getByRole( 'slider', {
			name: 'Overlay opacity',
		} );

		// With dimRatio at 0, the overlay is fully transparent.
		// The background defaults to white → should be light, not dark.
		// This is the regression from PR #53253.
		await opacitySlider.fill( '0' );
		await expect( coverBlock ).toHaveClass( /is-light/ );

		// Set it back to 100 → should be dark again.
		await opacitySlider.fill( '100' );
		await expect( coverBlock ).toHaveClass( /is-dark-theme/ );
	} );

	test( 'preserves explicit dimRatio of 100 when replacing an image', async ( {
		page,
		editor,
		coverBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/cover' } );
		const coverBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Cover',
		} );

		// Upload an initial image.
		await coverBlockUtils.upload(
			coverBlock.getByTestId( 'form-file-upload-input' )
		);

		// Wait for the image to load.
		await expect( coverBlock.locator( 'img' ) ).toBeVisible();

		// Select the Cover block (not the inner Paragraph) before opening sidebar.
		await editor.selectBlocks( coverBlock );

		// Open the sidebar and set overlay opacity to 100.
		await editor.openDocumentSettingsSidebar();
		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await editorSettings.getByRole( 'tab', { name: 'Styles' } ).click();

		const opacitySlider = editorSettings.getByRole( 'slider', {
			name: 'Overlay opacity',
		} );
		await opacitySlider.fill( '100' );

		// Verify the overlay opacity is now 100%.
		const overlay = coverBlock.locator( '.wp-block-cover__background' );
		await expect( overlay ).toHaveCSS(
			'background-color',
			'rgb(179, 179, 179)'
		);
		await expect( overlay ).toHaveCSS( 'opacity', '1' );

		// Replace the image via the toolbar.
		await editor.selectBlocks( coverBlock );
		await editor.showBlockToolbar();

		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Replace' } )
			.click();

		// Upload a new image via the replace dropdown.
		const replaceInput = page.getByTestId( 'form-file-upload-input' );
		await coverBlockUtils.upload( replaceInput );

		// Wait for the new image to load.
		await expect( coverBlock.locator( 'img' ) ).toBeVisible();

		// The dimRatio should STILL be 1, not reset to 0.5.
		// This is the regression from PR #55422 / issue #52835.
		await expect( overlay ).toHaveCSS(
			'background-color',
			'rgb(179, 179, 179)'
		);
		await expect( overlay ).toHaveCSS( 'opacity', '1' );
	} );

	test( 'shows the overlay when using an empty featured image', async ( {
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/cover' } );
		const coverBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Cover',
		} );

		// Enable "Use featured image" without setting a featured image.
		// This is the scenario from issue #57887 / PR #59855: the overlay
		// was not rendered when useFeaturedImage was true but the featured
		// image was empty.
		await coverBlock
			.getByRole( 'button', { name: 'Use featured image' } )
			.click();

		const overlay = coverBlock.locator( '.wp-block-cover__background' );
		await expect( overlay ).toBeVisible();
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

		this.GREEN_IMAGE_FILE_PATH = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'assets',
			'10x10_e2e_test_image_green.png'
		);
	}

	async upload( locator, imagePath ) {
		const srcPath = imagePath || this.TEST_IMAGE_FILE_PATH;
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-image-' )
		);
		const fileName = uuid();
		const tmpFileName = path.join( tmpDirectory, fileName + '.png' );
		await fs.copyFile( srcPath, tmpFileName );

		await locator.setInputFiles( tmpFileName );

		return fileName;
	}
}
