/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs/promises' );
const os = require( 'os' );
const { v4: uuid } = require( 'uuid' );
const snapshotDiff = require( 'snapshot-diff' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	imageBlockUtils: async ( { page }, use ) => {
		await use( new ImageBlockUtils( { page } ) );
	},
} );

test.describe( 'Image', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'can be inserted', async ( { editor, page, imageBlockUtils } ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = page.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		const filename = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		const image = imageBlock.locator( 'role=img' );
		await expect( image ).toBeVisible();
		await expect( image ).toHaveAttribute( 'src', new RegExp( filename ) );

		const regex = new RegExp(
			`<!-- wp:image {"id":(\\d+),"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="[^"]+\\/${ filename }\\.png" alt="" class="wp-image-\\1"/></figure>
<!-- \\/wp:image -->`
		);
		expect( await editor.getEditedPostContent() ).toMatch( regex );
	} );

	test( 'should replace, reset size, and keep selection', async ( {
		editor,
		page,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = page.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.locator( 'role=img' );

		const filename = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		{
			await expect( image ).toBeVisible();
			await expect( image ).toHaveAttribute(
				'src',
				new RegExp( filename )
			);

			const regex = new RegExp(
				`<!-- wp:image {"id":(\\d+),"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="[^"]+\\/${ filename }\\.png" alt="" class="wp-image-\\1"/></figure>
<!-- \\/wp:image -->`
			);
			expect( await editor.getEditedPostContent() ).toMatch( regex );
		}

		{
			await editor.openDocumentSettingsSidebar();
			await page.click(
				'role=group[name="Image size presets"i] >> role=button[name="25%"i]'
			);

			await expect( image ).toHaveCSS( 'width', '3px' );
			await expect( image ).toHaveCSS( 'height', '3px' );

			const regex = new RegExp(
				`<!-- wp:image {"id":(\\d+),"width":3,"height":3,"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full is-resized"><img src="[^"]+\\/${ filename }\\.png" alt="" class="wp-image-\\1" width="3" height="3"\\/><\\/figure>
<!-- /wp:image -->`
			);

			expect( await editor.getEditedPostContent() ).toMatch( regex );
		}

		{
			await editor.showBlockToolbar();
			await page.click( 'role=button[name="Replace"i]' );

			const replacedFilename = await imageBlockUtils.upload(
				page
					// Ideally the menu should have the name of "Replace" but is currently missing.
					// Hence, we fallback to using CSS classname instead.
					.locator( '.block-editor-media-replace-flow__options' )
					.locator( 'data-testid=form-file-upload-input' )
			);

			await expect( image ).toHaveAttribute(
				'src',
				new RegExp( replacedFilename )
			);
			await expect( image ).toBeVisible();

			const regex = new RegExp(
				`<!-- wp:image {"id":(\\d+),"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="[^"]+\\/${ replacedFilename }\\.png" alt="" class="wp-image-\\1"/></figure>
<!-- \\/wp:image -->`
			);
			expect( await editor.getEditedPostContent() ).toMatch( regex );
		}

		{
			// Focus outside the block to avoid the image caption being selected
			// It can happen on CI specially.
			await page.click( 'role=textbox[name="Add title"i]' );
			await image.click();
			await page.keyboard.press( 'Backspace' );

			expect( await editor.getEditedPostContent() ).toBe( '' );
		}
	} );

	test( 'should place caret on caption when clicking to add one', async ( {
		editor,
		page,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = page.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.locator( 'role=img' );

		const filename = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);
		await expect( image ).toHaveAttribute( 'src', new RegExp( filename ) );
		await editor.clickBlockToolbarButton( 'Add caption' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '2' );

		expect(
			await page.evaluate( () => document.activeElement.innerHTML )
		).toBe( '12' );
	} );

	test( 'should allow soft line breaks in caption', async ( {
		editor,
		page,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = page.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.locator( 'role=img' );

		const fileName = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		await expect( image ).toBeVisible();
		await expect( image ).toHaveAttribute( 'src', new RegExp( fileName ) );
		await editor.clickBlockToolbarButton( 'Add caption' );
		await page.keyboard.type( '12' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Enter' );

		expect(
			await page.evaluate( () => document.activeElement.innerHTML )
		).toBe( '1<br data-rich-text-line-break="true">2' );
	} );

	test( 'should have keyboard navigable toolbar for caption', async ( {
		editor,
		page,
		pageUtils,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = page.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.locator( 'role=img' );

		const fileName = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		await expect( image ).toBeVisible();
		await expect( image ).toHaveAttribute( 'src', new RegExp( fileName ) );

		// Add caption and navigate to inline toolbar.
		await editor.clickBlockToolbarButton( 'Add caption' );
		await pageUtils.pressKeyWithModifier( 'shift', 'Tab' );
		await expect(
			await page.evaluate( () =>
				document.activeElement.getAttribute( 'aria-label' )
			)
		).toBe( 'Bold' );

		// Bold to italic,
		await page.keyboard.press( 'ArrowRight' );
		// Italic to link,
		await page.keyboard.press( 'ArrowRight' );
		// Link to italic,
		await page.keyboard.press( 'ArrowLeft' );
		// Italic to bold.
		await page.keyboard.press( 'ArrowLeft' );
		await expect(
			await page.evaluate( () =>
				document.activeElement.getAttribute( 'aria-label' )
			)
		).toBe( 'Bold' );

		await page.keyboard.press( 'Space' );
		await page.keyboard.press( 'a' );
		await page.keyboard.press( 'ArrowRight' );

		expect(
			await page.evaluate( () => document.activeElement.innerHTML )
		).toBe( '<strong>a</strong>' );
	} );

	test( 'should drag and drop files into media placeholder', async ( {
		editor,
		page,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = page.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.locator( 'role=img' );

		const tmpInput = await page.evaluateHandle( () => {
			const input = document.createElement( 'input' );
			input.type = 'file';
			return input;
		} );

		const fileName = await imageBlockUtils.upload( tmpInput );

		const paragraphRect = await imageBlock.boundingBox();
		const pX = paragraphRect.x + paragraphRect.width / 2;
		const pY = paragraphRect.y + paragraphRect.height / 3;

		await imageBlock.evaluate(
			( element, [ input, clientX, clientY ] ) => {
				const dataTransfer = new window.DataTransfer();
				dataTransfer.items.add( input.files[ 0 ] );
				const event = new window.DragEvent( 'drop', {
					bubbles: true,
					clientX,
					clientY,
					dataTransfer,
				} );
				element.dispatchEvent( event );
			},
			[ tmpInput, pX, pY ]
		);

		await expect( image ).toHaveAttribute( 'src', new RegExp( fileName ) );
	} );

	test( 'allows zooming using the crop tools', async ( {
		editor,
		page,
		pageUtils,
		imageBlockUtils,
	} ) => {
		// Insert the block, upload a file and crop.
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = page.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.locator( 'role=img' );

		const filename = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		await expect( image ).toHaveAttribute( 'src', new RegExp( filename ) );

		// Assert that the image is initially unscaled and unedited.
		const initialImageSrc = await image.getAttribute( 'src' );
		const initialImageDataURL = await imageBlockUtils.getDataURL( image );

		// Zoom in to twice the amount using the zoom input.
		await editor.clickBlockToolbarButton( 'Crop' );
		await editor.clickBlockToolbarButton( 'Zoom' );
		await expect(
			page.locator( 'role=slider[name="Zoom"i]' )
		).toBeFocused();

		await page.keyboard.press( 'Tab' );
		await expect(
			page.locator( 'role=spinbutton[name="Zoom"i]' )
		).toBeFocused();

		await pageUtils.pressKeyWithModifier( 'primary', 'a' );
		await page.keyboard.type( '200' );
		await page.keyboard.press( 'Escape' );
		await editor.clickBlockToolbarButton( 'Apply' );

		// Wait for the cropping tools to disappear.
		await expect(
			page.locator( 'role=button[name="Apply"i]' )
		).toBeHidden();

		// Assert that the image is edited.
		const updatedImageSrc = await image.getAttribute( 'src' );
		expect( initialImageSrc ).not.toEqual( updatedImageSrc );

		const updatedImageDataURL = await imageBlockUtils.getDataURL( image );
		expect( initialImageDataURL ).not.toEqual( updatedImageDataURL );

		expect(
			snapshotDiff( initialImageDataURL, updatedImageDataURL )
		).toMatchSnapshot();
	} );

	test( 'allows changing aspect ratio using the crop tools', async ( {
		editor,
		page,
		imageBlockUtils,
	} ) => {
		// Insert the block, upload a file and crop.
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = page.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.locator( 'role=img' );

		const filename = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		await expect( image ).toHaveAttribute( 'src', new RegExp( filename ) );

		// Assert that the image is initially unscaled and unedited.
		const initialImageSrc = await image.getAttribute( 'src' );
		const initialImageDataURL = await imageBlockUtils.getDataURL( image );

		// Zoom in to twice the amount using the zoom input.
		await editor.clickBlockToolbarButton( 'Crop' );
		await editor.clickBlockToolbarButton( 'Aspect Ratio' );
		await page.click(
			'role=menu[name="Aspect Ratio"i] >> role=menuitemradio[name="16:10"i]'
		);
		await editor.clickBlockToolbarButton( 'Apply' );

		// Wait for the cropping tools to disappear.
		await expect(
			page.locator( 'role=button[name="Apply"i]' )
		).toBeHidden();

		// Assert that the image is edited.
		const updatedImageSrc = await image.getAttribute( 'src' );
		const updatedImageDataURL = await imageBlockUtils.getDataURL( image );

		expect( initialImageSrc ).not.toEqual( updatedImageSrc );
		expect( initialImageDataURL ).not.toEqual( updatedImageDataURL );

		expect(
			snapshotDiff( initialImageDataURL, updatedImageDataURL )
		).toMatchSnapshot();
	} );

	test( 'allows rotating using the crop tools', async ( {
		editor,
		page,
		imageBlockUtils,
	} ) => {
		// Insert the block, upload a file and crop.
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = page.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.locator( 'role=img' );

		const filename = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		await expect( image ).toHaveAttribute( 'src', new RegExp( filename ) );

		// Assert that the image is initially unscaled and unedited.
		const initialImageDataURL = await imageBlockUtils.getDataURL( image );

		// Rotate the image.
		await editor.clickBlockToolbarButton( 'Crop' );
		await editor.clickBlockToolbarButton( 'Rotate' );
		await editor.clickBlockToolbarButton( 'Apply' );

		// Wait for the cropping tools to disappear.
		await expect(
			page.locator( 'role=button[name="Apply"i]' )
		).toBeHidden();

		// Assert that the image is edited.
		await expect
			.poll( async () => imageBlockUtils.getDataURL( image ) )
			.not.toBe( initialImageDataURL );

		const updatedImageDataURL = await imageBlockUtils.getDataURL( image );

		expect(
			snapshotDiff( initialImageDataURL, updatedImageDataURL )
		).toMatchSnapshot();
	} );

	test( 'Should reset dimensions on change URL', async ( {
		editor,
		page,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = page.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.locator( 'role=img' );

		{
			// Upload an initial image.
			const filename = await imageBlockUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' )
			);
			await expect( image ).toHaveAttribute(
				'src',
				new RegExp( filename )
			);

			// Resize the Uploaded Image.
			await editor.openDocumentSettingsSidebar();
			await page.click(
				'role=group[name="Image size presets"i] >> role=button[name="25%"i]'
			);

			const regex = new RegExp(
				`<!-- wp:image {"id":(\\d+),"width":3,"height":3,"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full is-resized"><img src="[^"]+/${ filename }\\.png" alt="" class="wp-image-\\1" width="3" height="3"/></figure>
<!-- /wp:image -->`
			);

			// Check if dimensions are changed.
			expect( await editor.getEditedPostContent() ).toMatch( regex );
		}

		{
			const imageUrl = '/wp-includes/images/w-logo-blue.png';

			// Replace uploaded image with an URL.
			await editor.clickBlockToolbarButton( 'Replace' );
			await page.click( 'role=button[name="Edit"i]' );
			// Replace the url.
			await page.fill( 'role=combobox[name="URL"i]', imageUrl );
			await page.click( 'role=button[name="Apply"i]' );

			const regex = new RegExp(
				`<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="${ imageUrl }" alt=""/></figure>
<!-- /wp:image -->`
			);

			// Check if dimensions are reset.
			expect( await editor.getEditedPostContent() ).toMatch( regex );
		}
	} );

	test( 'should undo without broken temporary state', async ( {
		editor,
		page,
		pageUtils,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = page.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.locator( 'role=img' );

		const filename = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		await expect( image ).toHaveAttribute( 'src', new RegExp( filename ) );
		await page.focus( '.wp-block-image' );
		await pageUtils.pressKeyWithModifier( 'primary', 'z' );

		// Expect an empty image block (placeholder) rather than one with a
		// broken temporary URL.
		expect( await editor.getEditedPostContent() ).toBe( `<!-- wp:image -->
<figure class="wp-block-image"><img alt=""/></figure>
<!-- /wp:image -->` );
	} );
} );

class ImageBlockUtils {
	constructor( { page } ) {
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

	async getDataURL( element ) {
		return element.evaluate( ( node ) => {
			const canvas = document.createElement( 'canvas' );
			const context = canvas.getContext( '2d' );
			canvas.width = node.width;
			canvas.height = node.height;
			context.drawImage( node, 0, 0 );
			return canvas.toDataURL( 'image/jpeg' );
		} );
	}
}
