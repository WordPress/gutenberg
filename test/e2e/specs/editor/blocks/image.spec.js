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

	test( 'can be inserted via image upload', async ( {
		editor,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		const filename = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toBeVisible();
		await expect( image ).toHaveAttribute( 'src', new RegExp( filename ) );

		const regex = new RegExp(
			`<!-- wp:image {"id":(\\d+),"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="[^"]+\\/${ filename }\\.png" alt="" class="wp-image-\\1"/></figure>
<!-- \\/wp:image -->`
		);
		expect( await editor.getEditedPostContent() ).toMatch( regex );
	} );

	test( 'should place caret on caption when clicking to add one', async ( {
		editor,
		page,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );

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
			await editor.canvas
				.locator( ':root' )
				.evaluate( () => document.activeElement.innerHTML )
		).toBe( '12' );
	} );

	test( 'should allow soft line breaks in caption', async ( {
		editor,
		page,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );

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
			await editor.canvas
				.locator( ':root' )
				.evaluate( () => document.activeElement.innerHTML )
		).toBe( '1<br data-rich-text-line-break="true">2' );
	} );

	test( 'should have keyboard navigable toolbar for caption', async ( {
		editor,
		page,
		pageUtils,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );

		const fileName = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		await expect( image ).toBeVisible();
		await expect( image ).toHaveAttribute( 'src', new RegExp( fileName ) );

		// Add caption and navigate to inline toolbar.
		await editor.clickBlockToolbarButton( 'Add caption' );
		await pageUtils.pressKeys( 'shift+Tab' );
		expect(
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
		expect(
			await page.evaluate( () =>
				document.activeElement.getAttribute( 'aria-label' )
			)
		).toBe( 'Bold' );

		await page.keyboard.press( 'Space' );
		await page.keyboard.press( 'a' );
		await page.keyboard.press( 'ArrowRight' );

		expect(
			await editor.canvas
				.locator( ':root' )
				.evaluate( () => document.activeElement.innerHTML )
		).toBe( '<strong>a</strong>' );
	} );

	test( 'should drag and drop files into media placeholder', async ( {
		editor,
		page,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );

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

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );

		const filename = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		await expect( image ).toHaveAttribute( 'src', new RegExp( filename ) );

		// Assert that the image is initially unscaled and unedited.
		const initialImageSrc = await image.getAttribute( 'src' );
		await expect
			.poll( () => image.boundingBox() )
			.toMatchObject( {
				height: 10,
				width: 10,
			} );

		// Zoom in to twice the amount using the zoom input.
		await editor.clickBlockToolbarButton( 'Crop' );
		await editor.clickBlockToolbarButton( 'Zoom' );
		await expect(
			page.locator( 'role=slider[name="Zoom"i]' )
		).toBeFocused();

		await pageUtils.pressKeys( 'Tab' );
		await expect(
			page.locator( 'role=spinbutton[name="Zoom"i]' )
		).toBeFocused();

		await pageUtils.pressKeys( 'primary+a' );
		await page.keyboard.type( '200' );
		await page.keyboard.press( 'Escape' );
		await editor.clickBlockToolbarButton( 'Apply' );

		// Wait for the cropping tools to disappear.
		await expect(
			page.locator( 'role=button[name="Save"i]' )
		).toBeHidden();

		// Assert that the image is edited.
		const updatedImageSrc = await image.getAttribute( 'src' );
		expect( initialImageSrc ).not.toEqual( updatedImageSrc );

		await expect
			.poll( () => image.boundingBox() )
			.toMatchObject( {
				height: 5,
				width: 5,
			} );

		expect(
			await imageBlockUtils.getImageBuffer( updatedImageSrc )
		).toMatchSnapshot();
	} );

	test( 'allows changing aspect ratio using the crop tools', async ( {
		editor,
		page,
		imageBlockUtils,
	} ) => {
		// Insert the block, upload a file and crop.
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );

		const filename = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		await expect( image ).toHaveAttribute( 'src', new RegExp( filename ) );

		// Assert that the image is initially unscaled and unedited.
		const initialImageSrc = await image.getAttribute( 'src' );
		await expect
			.poll( () => image.boundingBox() )
			.toMatchObject( {
				height: 10,
				width: 10,
			} );

		// Zoom in to twice the amount using the zoom input.
		await editor.clickBlockToolbarButton( 'Crop' );
		await editor.clickBlockToolbarButton( 'Aspect Ratio' );
		await page.click(
			'role=menu[name="Aspect Ratio"i] >> role=menuitemradio[name="Wide - 16:9"i]'
		);
		await editor.clickBlockToolbarButton( 'Apply' );

		// Wait for the cropping tools to disappear.
		await expect(
			page.locator( 'role=button[name="Save"i]' )
		).toBeHidden();

		// Assert that the image is edited.
		const updatedImageSrc = await image.getAttribute( 'src' );
		expect( updatedImageSrc ).not.toEqual( initialImageSrc );

		await expect
			.poll( () => image.boundingBox() )
			.toMatchObject( {
				height: 6,
				width: 10,
			} );

		expect(
			await imageBlockUtils.getImageBuffer( updatedImageSrc )
		).toMatchSnapshot();
	} );

	test( 'allows rotating using the crop tools', async ( {
		editor,
		page,
		imageBlockUtils,
	} ) => {
		// Insert the block, upload a file and crop.
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );

		const filename = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		await expect( image ).toHaveAttribute( 'src', new RegExp( filename ) );

		// Rotate the image.
		await editor.clickBlockToolbarButton( 'Crop' );
		await editor.clickBlockToolbarButton( 'Rotate' );
		await editor.clickBlockToolbarButton( 'Apply' );

		// Wait for the cropping tools to disappear.
		await expect(
			page.locator( 'role=button[name="Save"i]' )
		).toBeHidden();

		// Assert that the image is edited.
		const updatedImageSrc = await image.getAttribute( 'src' );

		expect(
			await imageBlockUtils.getImageBuffer( updatedImageSrc )
		).toMatchSnapshot();
	} );

	test( 'should undo without broken temporary state', async ( {
		editor,
		pageUtils,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );

		const filename = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		await expect( image ).toHaveAttribute( 'src', new RegExp( filename ) );
		await editor.canvas.locator( '.wp-block-image' ).focus();
		await pageUtils.pressKeys( 'primary+z' );

		// Expect an empty image block (placeholder) rather than one with a
		// broken temporary URL.
		expect( await editor.getEditedPostContent() ).toBe( `<!-- wp:image -->
<figure class="wp-block-image"><img alt=""/></figure>
<!-- /wp:image -->` );
	} );

	test( 'can be replaced by dragging-and-dropping images from the inserter', async ( {
		page,
		editor,
	} ) => {
		// This is a temp workaround for dragging and dropping images from the inserter.
		// This should be removed when we have the zoom out view for media categories.
		await page.setViewportSize( { width: 1400, height: 800 } );
		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );
		const blockLibrary = page.getByRole( 'region', {
			name: 'Block Library',
		} );

		async function openMediaTab() {
			const blockInserter = page.getByRole( 'button', {
				name: 'Toggle block inserter',
			} );
			const isClosed =
				( await blockInserter.getAttribute( 'aria-pressed' ) ) ===
				'false';

			if ( isClosed ) {
				await blockInserter.click();
			}

			await blockLibrary.getByRole( 'tab', { name: 'Media' } ).click();

			await blockLibrary
				.getByRole( 'tabpanel', { name: 'Media' } )
				.getByRole( 'tab', { name: 'Openverse' } )
				.click();
		}

		await openMediaTab();

		// Drag the first image from the media library into the image block.
		await blockLibrary
			.getByRole( 'listbox', { name: 'Media List' } )
			.getByRole( 'option' )
			.first()
			.dragTo( imageBlock );

		await expect( async () => {
			const blocks = await editor.getBlocks();
			expect( blocks ).toHaveLength( 1 );

			const [
				{
					attributes: { url },
				},
			] = blocks;
			await expect( imageBlock.getByRole( 'img' ) ).toHaveAttribute(
				'src',
				url
			);
			expect(
				new URL( url ).host,
				'should be updated to the media library'
			).toBe( new URL( page.url() ).host );
		}, 'should update the image from the media inserter' ).toPass();
		const [
			{
				attributes: { url: firstUrl },
			},
		] = await editor.getBlocks();

		await openMediaTab();

		// Drag the second image from the media library into the image block.
		await blockLibrary
			.getByRole( 'listbox', { name: 'Media List' } )
			.getByRole( 'option' )
			.nth( 1 )
			.dragTo( imageBlock );

		await expect( async () => {
			const blocks = await editor.getBlocks();
			expect( blocks ).toHaveLength( 1 );

			const [
				{
					attributes: { url },
				},
			] = blocks;
			expect( url ).not.toBe( firstUrl );
			await expect( imageBlock.getByRole( 'img' ) ).toHaveAttribute(
				'src',
				url
			);
			expect(
				new URL( url ).host,
				'should be updated to the media library'
			).toBe( new URL( page.url() ).host );
		}, 'should replace the original image with the second image' ).toPass();
	} );

	test( 'should allow dragging and dropping HTML to media placeholder', async ( {
		page,
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );

		const html = `
			<figure>
				<img src="https://live.staticflickr.com/3894/14962688165_04759a8b03_b.jpg" alt="Cat">
				<figcaption>"Cat" by tomhouslay is licensed under <a href="https://creativecommons.org/licenses/by-nc/2.0/?ref=openverse">CC BY-NC 2.0</a>.</figcaption>
			</figure>
		`;

		await page.evaluate( ( _html ) => {
			const dummy = document.createElement( 'div' );
			dummy.style.width = '10px';
			dummy.style.height = '10px';
			dummy.style.zIndex = 99999;
			dummy.style.position = 'fixed';
			dummy.style.top = 0;
			dummy.style.left = 0;
			dummy.draggable = 'true';
			dummy.addEventListener( 'dragstart', ( event ) => {
				event.dataTransfer.setData( 'text/html', _html );
				setTimeout( () => {
					dummy.remove();
				}, 0 );
			} );
			document.body.appendChild( dummy );
		}, html );

		await page.mouse.move( 0, 0 );
		await page.mouse.down();
		await imageBlock.hover();
		await page.mouse.up();

		const host = new URL( page.url() ).host;

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/image',
				attributes: {
					link: expect.stringContaining( host ),
					url: expect.stringContaining( host ),
					id: expect.any( Number ),
					alt: 'Cat',
					caption: `"Cat" by tomhouslay is licensed under <a href="https://creativecommons.org/licenses/by-nc/2.0/?ref=openverse">CC BY-NC 2.0</a>.`,
				},
			},
		] );
		const url = ( await editor.getBlocks() )[ 0 ].attributes.url;
		await expect( imageBlock.getByRole( 'img' ) ).toHaveAttribute(
			'src',
			url
		);
	} );

	test( 'image inserted via upload should appear in the frontend published post content', async ( {
		editor,
		imageBlockUtils,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		const filename = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		const imageInEditor = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( imageInEditor ).toBeVisible();
		await expect( imageInEditor ).toHaveAttribute(
			'src',
			new RegExp( filename )
		);

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const figureDom = page.getByRole( 'figure' );
		await expect( figureDom ).toBeVisible();

		const imageDom = figureDom.locator( 'img' );
		await expect( imageDom ).toBeVisible();
		await expect( imageDom ).toHaveAttribute(
			'src',
			new RegExp( filename )
		);
	} );

	test( 'image inserted via link should appear in the frontend published post content', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		await imageBlock
			.getByRole( 'button' )
			.filter( { hasText: 'Insert from URL' } )
			.click();

		// This form lacks distinguishing qualities other than the
		// class name, so we use page.locator() instead of page.getByRole()
		const form = page.locator(
			'form.block-editor-media-placeholder__url-input-form'
		);

		const imgUrl =
			'https://wp20.wordpress.net/wp-content/themes/twentyseventeen-wp20/images/wp20-logo-white.svg';

		await form.getByLabel( 'URL' ).fill( imgUrl );
		await form.getByRole( 'button', { name: 'Apply' } ).click();

		const imageInEditor = imageBlock.locator( 'role=img' );
		await expect( imageInEditor ).toBeVisible();
		await expect( imageInEditor ).toHaveAttribute( 'src', imgUrl );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const figureDom = page.getByRole( 'figure' );
		await expect( figureDom ).toBeVisible();

		const imageDom = figureDom.locator( 'img' );
		await expect( imageDom ).toBeVisible();
		await expect( imageDom ).toHaveAttribute( 'src', imgUrl );
	} );

	test( 'adding a link should reflect configuration in published post content', async ( {
		editor,
		page,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		await page.getByLabel( 'Block tools' ).getByLabel( 'Link' ).click();

		// This form lacks distinguishing qualities other than the
		// class name, so we use page.locator() instead of page.getByRole()
		const form = page.locator( '.block-editor-url-popover__link-editor' );

		const url = 'https://wordpress.org';

		await form.getByLabel( 'URL' ).fill( url );

		await form.getByRole( 'button', { name: 'Apply' } ).click();

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const figureDom = page.getByRole( 'figure' );
		await expect( figureDom ).toBeVisible();

		const linkDom = figureDom.locator( 'a' );
		await expect( linkDom ).toBeVisible();
		await expect( linkDom ).toHaveAttribute( 'href', url );
	} );

	test( 'should upload external image to media library', async ( {
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				url: 'https://cldup.com/cXyG__fTLN.jpg',
			},
		} );

		await editor.clickBlockToolbarButton( 'Upload to Media Library' );

		await expect(
			editor.canvas
				.locator( 'role=document[name="Block: Image"i]' )
				.locator( 'img[src^="http"]' )
		).toHaveAttribute(
			'src',
			expect.stringMatching( /\/wp-content\/uploads\// )
		);
	} );

	test( 'should upload through prepublish panel', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				url: 'https://cldup.com/cXyG__fTLN.jpg',
			},
		} );

		await page
			.getByRole( 'button', { name: 'Publish', exact: true } )
			.click();
		await page
			.getByRole( 'button', { name: 'Upload', exact: true } )
			.click();

		await expect( page.locator( '.components-spinner' ) ).toHaveCount( 0 );
		await expect(
			editor.canvas
				.locator( 'role=document[name="Block: Image"i]' )
				.locator( 'img[src^="http"]' )
		).toHaveAttribute(
			'src',
			expect.stringMatching( /\/wp-content\/uploads\// )
		);
	} );

	test( 'uploads data url through blobs from raw handling', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		const blobUrl = await page.evaluate( async () => {
			const canvas = document.createElement( 'canvas' );
			canvas.width = 20;
			canvas.height = 20;

			const ctx = canvas.getContext( '2d' );
			ctx.fillStyle = 'red';
			ctx.fillRect( 0, 0, 20, 20 );

			return canvas.toDataURL( 'image/png' );
		} );

		pageUtils.setClipboardData( { html: `<img src="${ blobUrl }">` } );

		await pageUtils.pressKeys( 'primary+v' );

		await expect(
			editor.canvas
				.locator( 'role=document[name="Block: Image"i]' )
				.locator( 'img[src^="http"]' )
		).toHaveAttribute(
			'src',
			expect.stringMatching( /\/wp-content\/uploads\// )
		);
	} );

	test( 'should have keyboard navigable link UI popover', async ( {
		editor,
		page,
		pageUtils,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		await page.getByLabel( 'Block tools' ).getByLabel( 'Link' ).click();

		const uriInput = page.getByRole( 'combobox', {
			name: 'URL',
		} );

		await expect( uriInput ).toBeFocused();

		// Enter a link.
		await uriInput.fill( 'https://example.com' );
		await page.keyboard.press( 'Enter' );
		await expect(
			page.getByRole( 'link', {
				name: 'example.com',
			} )
		).toBeFocused();

		// Edit a link.
		await pageUtils.pressKeys( 'Tab' );
		await page.keyboard.press( 'Enter' );
		await expect( uriInput ).toBeFocused();
		await uriInput.fill( 'https://example.com/updated/' );
		await page.keyboard.press( 'Enter' );
		await expect(
			page.getByRole( 'link', {
				name: 'example.com/updated/',
			} )
		).toBeFocused();

		// Remove a link.
		await pageUtils.pressKeys( 'Tab', { times: 2 } );
		await expect(
			page.getByRole( 'button', { name: 'Remove link' } )
		).toBeFocused();
		await page.keyboard.press( 'Enter' );
		await expect( uriInput ).toBeFocused();
		await expect( uriInput ).toBeEmpty();

		// Select "Link to image file".
		await pageUtils.pressKeys( 'Tab', { times: 3 } );
		await expect(
			page.getByRole( 'menuitem', { name: 'Link to image file' } )
		).toBeFocused();
		await page.keyboard.press( 'Enter' );
		await expect(
			page.getByRole( 'link', {
				name: 'Link to image file',
			} )
		).toBeFocused();

		// Select "Link to attachment page".
		await pageUtils.pressKeys( 'Tab' );
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeys( 'Tab', { times: 4 } );
		await expect(
			page.getByRole( 'menuitem', { name: 'Link to attachment page' } )
		).toBeFocused();
		await page.keyboard.press( 'Enter' );
		await expect(
			page.getByRole( 'link', {
				name: 'Link to attachment page',
			} )
		).toBeFocused();

		// Select "Expand on click", then remove it.
		await pageUtils.pressKeys( 'Tab' );
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeys( 'Tab', { times: 5 } );
		await expect(
			page.getByRole( 'menuitem', { name: 'Expand on click' } )
		).toBeFocused();
		await page.keyboard.press( 'Enter' );
		await expect(
			page.getByRole( 'button', {
				name: 'Disable expand on click',
			} )
		).toBeFocused();
		await page.keyboard.press( 'Enter' );
		await expect( uriInput ).toBeFocused();
		await expect( uriInput ).toBeEmpty();
	} );
} );

test.describe( 'Image - lightbox', () => {
	let uploadedMedia;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
		uploadedMedia = await requestUtils.uploadMedia(
			path.resolve(
				process.cwd(),
				'test/e2e/assets/10x10_e2e_test_image_z9T8jK.png'
			)
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.describe( 'should respect theme.json settings and block overrides', () => {
		test.describe( 'Theme.json settings - allow editing FALSE, enabled FALSE', () => {
			test.beforeAll( async ( { requestUtils } ) => {
				await requestUtils.activatePlugin(
					'lightbox-allow-editing-false-enabled-false'
				);
			} );

			test.afterAll( async ( { requestUtils } ) => {
				await requestUtils.deactivatePlugin(
					'lightbox-allow-editing-false-enabled-false'
				);
			} );

			test( 'Block settings - link DISABLED, lightbox UNDEFINED - should hide UI when block override is undefined', async ( {
				editor,
				page,
			} ) => {
				await editor.setContent( `<!-- wp:image {"id":${ uploadedMedia.id },"sizeSlug":"full","linkDestination":"none"} -->
				<figure class="wp-block-image size-full"><img src="${ uploadedMedia.source_url }" alt="" class="wp-image-${ uploadedMedia.id }"/></figure>
				<!-- /wp:image --> ` );

				const imageBlock = editor.canvas.locator(
					'role=document[name="Block: Image"i]'
				);

				await imageBlock.click();
				await page
					.getByLabel( 'Block tools' )
					.getByLabel( 'Link' )
					.click();

				await expect(
					page.getByRole( 'menuitem', {
						name: 'Expand on click',
					} )
				).toBeHidden();
			} );

			test( 'Block settings - link DISABLED, lightbox ENABLED - should show UI while block override is active, but hide UI if override is removed', async ( {
				editor,
				page,
			} ) => {
				await editor.setContent( `<!-- wp:image {"id":${ uploadedMedia.id },"sizeSlug":"full","linkDestination":"none","lightbox":{"enabled":true}} -->
				<figure class="wp-block-image size-full"><img src="${ uploadedMedia.source_url }" alt="" class="wp-image-${ uploadedMedia.id }"/></figure>
				<!-- /wp:image --> ` );

				const imageBlock = editor.canvas.locator(
					'role=document[name="Block: Image"i]'
				);

				await imageBlock.click();
				await page
					.getByLabel( 'Block tools' )
					.getByLabel( 'Link' )
					.click();

				await page
					.getByRole( 'button', {
						name: 'Disable expand on click',
					} )
					.click();

				await expect(
					page.getByRole( 'menuitem', {
						name: 'Expand on click',
					} )
				).toBeHidden();
			} );
		} );
	} );

	test.describe( 'should render as expected on front end', () => {
		test( "Overlay image should not inherit content image's margins", async ( {
			editor,
			page,
		} ) => {
			await editor.setContent( `<!-- wp:image {"id":${ uploadedMedia.id },"sizeSlug":"full","linkDestination":"none",
			"lightbox":{"enabled":true},"style":{"spacing":{"margin":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
			<figure class="wp-block-image size-full" style="margin-top:var(--wp--preset--spacing--40);margin-right:var(--wp--preset--spacing--40);margin-bottom:var(--wp--preset--spacing--40);margin-left:var(--wp--preset--spacing--40)">
			<img src="${ uploadedMedia.source_url }" alt="" class="wp-image-${ uploadedMedia.id }"/></figure>
			<!-- /wp:image --> ` );

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );

			const lightboxImage = page.locator( '.wp-lightbox-container img' );
			await expect( lightboxImage ).toBeVisible();
			await lightboxImage.click();

			const figure = page
				.locator( '.wp-lightbox-overlay .wp-block-image' )
				.first();
			await expect( figure ).toBeVisible();
			const margin = await figure.evaluate( ( element ) => {
				return window
					.getComputedStyle( element )
					.getPropertyValue( 'margin' );
			} );
			expect( margin ).toBe( '0px' );
		} );
	} );
} );

// Added to prevent regressions of https://github.com/WordPress/gutenberg/pull/57040.
test.describe( 'Image - Site editor', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'can be inserted via image upload', async ( {
		editor,
		imageBlockUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		const filename = await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);

		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toBeVisible();
		await expect( image ).toHaveAttribute( 'src', new RegExp( filename ) );

		const regex = new RegExp(
			`<!-- wp:image {"id":(\\d+),"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="[^"]+\\/${ filename }\\.png" alt="" class="wp-image-\\1"/></figure>
<!-- \\/wp:image -->`
		);
		expect( await editor.getEditedPostContent() ).toMatch( regex );
	} );
} );

class ImageBlockUtils {
	constructor( { page } ) {
		/** @type {Page} */
		this.page = page;
		this.basePath = path.join( __dirname, '..', '..', '..', 'assets' );

		this.TEST_IMAGE_FILE_PATH = path.join(
			this.basePath,
			'10x10_e2e_test_image_z9T8jK.png'
		);
	}

	async upload( inputElement, customFile = null ) {
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-image-' )
		);
		const filename = uuid();
		const tmpFileName = path.join( tmpDirectory, filename + '.png' );
		const filepath = customFile
			? path.join( this.basePath, customFile )
			: this.TEST_IMAGE_FILE_PATH;
		await fs.copyFile( filepath, tmpFileName );

		await inputElement.setInputFiles( tmpFileName );

		return filename;
	}

	async getImageBuffer( url ) {
		const response = await this.page.request.get( url );
		return await response.body();
	}

	async getHexString( element ) {
		return element.evaluate( ( node ) => {
			const canvas = document.createElement( 'canvas' );
			canvas.width = node.width;
			canvas.height = node.height;

			const context = canvas.getContext( '2d' );
			context.drawImage( node, 0, 0 );
			const imageData = context.getImageData(
				0,
				0,
				canvas.width,
				canvas.height
			);
			const pixels = imageData.data;

			let hexString = '';
			for ( let i = 0; i < pixels.length; i += 4 ) {
				if ( i !== 0 && i % ( canvas.width * 4 ) === 0 ) {
					hexString += '\n';
				}

				const r = pixels[ i ].toString( 16 ).padStart( 2, '0' );
				const g = pixels[ i + 1 ].toString( 16 ).padStart( 2, '0' );
				const b = pixels[ i + 2 ].toString( 16 ).padStart( 2, '0' );
				const a = pixels[ i + 3 ].toString( 16 ).padStart( 2, '0' );
				hexString += '#' + r + g + b + a;
			}
			return hexString;
		} );
	}
}
