const path = require( 'path' );
const fs = require( 'fs/promises' );
const os = require( 'os' );
const { randomUUID } = require( 'crypto' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	galleryBlockUtils: async ( { page }, use ) => {
		await use( new GalleryBlockUtils( { page } ) );
	},
} );

test.describe( 'Gallery', () => {
	let uploadedMedia;
	let landscapeMedia;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();

		uploadedMedia = await requestUtils.uploadMedia(
			'./assets/10x10_e2e_test_image_z9T8jK.png'
		);
		landscapeMedia = await requestUtils.uploadMedia(
			'./assets/200x150_e2e_test_image_opaque.png'
		);
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'can be transformed from pasting shortcode, and can undo/redo', async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		await admin.createNewPost();

		pageUtils.setClipboardData( {
			plainText: `[gallery ids="${ uploadedMedia.id }"]`,
		} );

		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await pageUtils.pressKeys( 'primary+v' );

		const img = editor.canvas.locator(
			'role=document[name="Block: Image"i] >> role=img'
		);

		await expect( img ).toHaveAttribute( 'src', uploadedMedia.source_url );
		await expect( img ).toBeVisible();

		const editedPostContent = await editor.getEditedPostContent();
		expect( editedPostContent )
			.toBe( `<!-- wp:gallery {"columns":3,"linkTo":"none"} -->
<figure class="wp-block-gallery has-nested-images columns-3 is-cropped"><!-- wp:image {"id":${ uploadedMedia.id },"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="${ uploadedMedia.source_url }" alt="${ uploadedMedia.alt_text }" class="wp-image-${ uploadedMedia.id }"/></figure>
<!-- /wp:image --></figure>
<!-- /wp:gallery -->` );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Undo' } )
			.click();

		await expect.poll( editor.getEditedPostContent ).toBe( '' );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Redo' } )
			.click();

		await expect
			.poll( editor.getEditedPostContent )
			.toBe( editedPostContent );
	} );

	test( 'can be created using uploaded images', async ( {
		admin,
		editor,
		galleryBlockUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/gallery' } );
		const galleryBlock = editor.canvas.locator(
			'role=document[name="Block: Gallery"i]'
		);
		await expect( galleryBlock ).toBeVisible();

		await galleryBlockUtils.upload(
			galleryBlock.locator( 'data-testid=form-file-upload-input' )
		);

		const image = galleryBlock.locator( 'role=img' );
		await expect( image ).toBeVisible();
		// Wait for upload to complete (includes client-side media processing time).
		// With client-side processing, the filename may be changed by the server.
		await expect( image ).toHaveAttribute( 'src', /^https?:\/\//, {
			timeout: 30_000,
		} );

		// Check that content has a valid gallery with an image.
		const regex = new RegExp(
			`<!-- wp:gallery {\\"linkTo\\":\\"none\\"} -->\\s*<figure class=\\"wp-block-gallery has-nested-images columns-default is-cropped\\"><!-- wp:image {\\"id\\":\\d+,\\"sizeSlug\\":\\"(?:full|large)\\",\\"linkDestination\\":\\"none\\"} -->\\s*<figure class=\\"wp-block-image (?:size-full|size-large)\\"><img src=\\"[^"]+\\" alt=\\"\\" class=\\"wp-image-\\d+\\"\/><\/figure>\\s*<!-- \/wp:image --><\/figure>\\s*<!-- \/wp:gallery -->`
		);
		await expect.poll( editor.getEditedPostContent ).toMatch( regex );
	} );

	test( 'gallery caption can be edited', async ( {
		admin,
		editor,
		page,
	} ) => {
		const galleryCaption = 'Tested gallery caption';

		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/gallery',
			innerBlocks: [
				{
					name: 'core/image',
					attributes: {
						id: uploadedMedia.id,
						url: uploadedMedia.source_url,
					},
				},
			],
		} );

		const gallery = editor.canvas.locator(
			'role=document[name="Block: Gallery"i]'
		);

		await expect( gallery ).toBeVisible();
		await editor.selectBlocks( gallery );
		await editor.clickBlockToolbarButton( 'Add caption' );

		const caption = gallery.locator(
			'role=textbox[name="Gallery caption text"i]'
		);
		await expect( caption ).toBeFocused();

		await page.keyboard.type( galleryCaption );

		await expect
			.poll( editor.getEditedPostContent )
			.toMatch(
				new RegExp( `<figcaption.*?>${ galleryCaption }</figcaption>` )
			);
	} );

	test( 'Grid layout uses native controls without Gallery Flex child styles', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/gallery',
			attributes: {
				caption: 'Gallery caption',
				columns: 2,
				imageCrop: true,
				layout: { type: 'flex' },
			},
			innerBlocks: [
				{
					name: 'core/image',
					attributes: {
						id: uploadedMedia.id,
						url: uploadedMedia.source_url,
						caption: 'Image caption',
					},
				},
				{
					name: 'core/image',
					attributes: {
						id: uploadedMedia.id,
						url: uploadedMedia.source_url,
					},
				},
			],
		} );

		const gallery = editor.canvas.locator( '.wp-block-gallery' );
		await editor.selectBlocks( gallery );
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'radio', { name: 'Transform to Gallery Grid' } )
			.click();

		await expect(
			page.getByRole( 'radio', { name: 'Gallery Grid' } )
		).toBeChecked();
		await page.getByRole( 'tab', { name: 'Settings' } ).click();
		await expect( page.getByLabel( 'Crop images to fit' ) ).toHaveCount(
			0
		);
		await page.getByRole( 'tab', { name: 'Styles' } ).click();
		await expect( page.getByText( 'Max. columns' ) ).toBeVisible();

		await expect( gallery ).toHaveClass( /is-layout-grid/ );
		await expect( gallery ).not.toHaveClass( /columns-2|is-cropped/ );

		const image = gallery.locator( '.wp-block-image' ).first();
		const imageCaption = image.locator( 'figcaption' );
		const galleryCaption = gallery.locator(
			':scope > .blocks-gallery-caption'
		);

		expect(
			await image.evaluate(
				( element ) => window.getComputedStyle( element ).display
			)
		).not.toBe( 'flex' );
		expect(
			await imageCaption.evaluate(
				( element ) => window.getComputedStyle( element ).position
			)
		).toBe( 'absolute' );
		expect(
			await galleryCaption.evaluate(
				( element ) => window.getComputedStyle( element ).gridColumnEnd
			)
		).toBe( '-1' );

		await editor.insertBlock( {
			name: 'core/gallery',
			attributes: { layout: { type: 'grid' } },
		} );
		const emptyGalleryPlaceholder = editor.canvas
			.locator( '.wp-block-gallery' )
			.last()
			.locator( '.block-editor-media-placeholder' );
		expect(
			await emptyGalleryPlaceholder.evaluate(
				( element ) => window.getComputedStyle( element ).gridColumnEnd
			)
		).toBe( '-1' );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const renderedGallery = page
			.locator( '.wp-block-gallery.is-layout-grid' )
			.first();
		await expect( renderedGallery ).not.toHaveClass(
			/columns-2|is-cropped|wp-block-gallery-\d+/
		);
		expect(
			await renderedGallery
				.locator( '.wp-block-image' )
				.first()
				.evaluate(
					( element ) => window.getComputedStyle( element ).display
				)
		).not.toBe( 'flex' );
		expect(
			await renderedGallery
				.locator( '.wp-block-image figcaption' )
				.evaluate(
					( element ) => window.getComputedStyle( element ).position
				)
		).toBe( 'absolute' );
		expect(
			await renderedGallery
				.locator( ':scope > .blocks-gallery-caption' )
				.evaluate(
					( element ) =>
						window.getComputedStyle( element ).gridColumnEnd
				)
		).toBe( '-1' );
	} );

	test( "uploaded images' captions can be edited", async ( {
		admin,
		editor,
		page,
	} ) => {
		const caption = 'Tested caption';

		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/gallery',
			innerBlocks: [
				{
					name: 'core/image',
					attributes: {
						id: uploadedMedia.id,
						url: uploadedMedia.source_url,
					},
				},
			],
		} );

		const galleryImage = editor.canvas.locator(
			'role=document[name="Block: Gallery"i] >> role=document[name="Block: Image"i]'
		);
		const imageCaption = galleryImage.locator(
			'role=textbox[name="Image caption text"i]'
		);
		await expect( galleryImage ).toBeVisible();

		await galleryImage.click();
		await editor.clickBlockToolbarButton( 'Add caption' );

		await expect( imageCaption ).toBeVisible();
		await imageCaption.click();

		await page.keyboard.type( caption );

		await expect
			.poll( editor.getEditedPostContent )
			.toMatch(
				new RegExp( `<figcaption.*?>${ caption }</figcaption>` )
			);
	} );

	test( 'when initially added the media library shows the Create Gallery view', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/gallery' } );
		await editor.canvas
			.locator( 'role=button[name="Media Library"i]' )
			.click();

		const mediaLibrary = page.locator(
			'role=dialog[name="Create gallery"i]'
		);

		await expect( mediaLibrary ).toBeVisible();
		await expect(
			mediaLibrary.locator( 'role=button[name="Create a new gallery"i]' )
		).toBeVisible();
	} );

	test( 'can randomize the image on the front end', async ( {
		admin,
		editor,
		page,
	} ) => {
		const numbers = Array.from( { length: 10 }, ( _, i ) => i + 1 );
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/gallery',
			attributes: {
				randomOrder: true,
			},
			innerBlocks: numbers.map( ( i ) => ( {
				name: 'core/image',
				attributes: {
					id: uploadedMedia.id,
					alt: i.toString(),
					url: uploadedMedia.source_url,
				},
			} ) ),
		} );
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );
		const imageElements = page.locator( '.wp-block-gallery img' );
		const imageAltTexts = await imageElements.evaluateAll( ( imgs ) =>
			imgs.map( ( img ) => parseInt( img.alt, 10 ) )
		);
		expect( numbers ).not.toEqual( imageAltTexts );
	} );

	test( 'can randomize the image with a lightbox effect on the front end', async ( {
		admin,
		editor,
		page,
	} ) => {
		const numbers = Array.from( { length: 10 }, ( _, i ) => i + 1 );
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/gallery',
			attributes: {
				randomOrder: true,
			},
			innerBlocks: numbers.map( ( i ) => ( {
				name: 'core/image',
				attributes: {
					id: uploadedMedia.id,
					alt: i.toString(),
					url: uploadedMedia.source_url,
					lightbox: { enabled: true },
				},
			} ) ),
		} );
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );
		const imageElements = page.locator( '.wp-block-gallery img' );
		const imageAltTexts = await imageElements.evaluateAll( ( imgs ) =>
			imgs.map( ( img ) => parseInt( img.alt, 10 ) )
		);
		expect( numbers ).not.toEqual( imageAltTexts );
	} );

	// Regression test for https://github.com/WordPress/gutenberg/issues/82252.
	test( 'crops linked images to a uniform height in the editor canvas', async ( {
		admin,
		editor,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/gallery',
			attributes: {
				linkTo: 'media',
			},
			innerBlocks: [
				{
					name: 'core/image',
					attributes: {
						id: landscapeMedia.id,
						url: landscapeMedia.source_url,
						sizeSlug: 'full',
						linkDestination: 'media',
						href: landscapeMedia.source_url,
					},
				},
				{
					name: 'core/image',
					attributes: {
						id: uploadedMedia.id,
						url: uploadedMedia.source_url,
						sizeSlug: 'full',
						linkDestination: 'media',
						href: uploadedMedia.source_url,
					},
				},
			],
		} );

		const images = editor.canvas.locator(
			'role=document[name="Block: Gallery"i] >> role=img'
		);
		await expect( images ).toHaveCount( 2 );

		// With cropping enabled, both images in the row render at the same
		// height. Poll so the assertion waits for both images to finish
		// loading and for the layout to settle.
		await expect
			.poll( async () => {
				const landscapeBox = await images.nth( 0 ).boundingBox();
				const squareBox = await images.nth( 1 ).boundingBox();
				if ( ! landscapeBox || ! squareBox ) {
					return Number.POSITIVE_INFINITY;
				}
				return Math.abs( landscapeBox.height - squareBox.height );
			} )
			.toBeLessThanOrEqual( 1 );
	} );

	test( 'does not crop images to a uniform height when cropping is disabled', async ( {
		admin,
		editor,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/gallery',
			attributes: {
				imageCrop: false,
			},
			innerBlocks: [
				{
					name: 'core/image',
					attributes: {
						id: landscapeMedia.id,
						url: landscapeMedia.source_url,
						sizeSlug: 'full',
					},
				},
				{
					name: 'core/image',
					attributes: {
						id: uploadedMedia.id,
						url: uploadedMedia.source_url,
						sizeSlug: 'full',
					},
				},
			],
		} );

		const images = editor.canvas.locator(
			'role=document[name="Block: Gallery"i] >> role=img'
		);
		await expect( images ).toHaveCount( 2 );

		// With cropping disabled, each image renders at its natural aspect
		// ratio, so the two images have different heights. Poll so the
		// assertion waits for both images to finish loading.
		await expect
			.poll( async () => {
				const landscapeBox = await images.nth( 0 ).boundingBox();
				const squareBox = await images.nth( 1 ).boundingBox();
				if ( ! landscapeBox || ! squareBox ) {
					return 0;
				}
				return Math.abs( landscapeBox.height - squareBox.height );
			} )
			.toBeGreaterThan( 10 );
	} );

	// Regression test for the dynamic gallery preview, where the gallery's
	// layout must be passed to `useBlockPreview` for the crop to apply.
	test( 'crops images to a uniform height in a dynamic gallery', async ( {
		admin,
		editor,
		requestUtils,
	} ) => {
		// A dynamic gallery resolves the images attached to the post being
		// edited, so create a post and attach two different-aspect-ratio
		// images to it.
		const post = await requestUtils.createPost( {
			title: 'Dynamic gallery',
			status: 'draft',
		} );
		for ( const file of [
			'./assets/200x150_e2e_test_image_opaque.png',
			'./assets/10x10_e2e_test_image_z9T8jK.png',
		] ) {
			const media = await requestUtils.uploadMedia( file );
			await requestUtils.rest( {
				method: 'POST',
				path: `/wp/v2/media/${ media.id }`,
				data: { post: post.id },
			} );
		}

		await admin.editPost( post.id );
		await editor.insertBlock( {
			name: 'core/gallery',
			attributes: {
				dynamicContent: { source: 'core/attached-media' },
				linkTo: 'media',
			},
		} );

		const images = editor.canvas.locator(
			'[data-type="core/gallery"] img'
		);
		// Wait for the dynamic source to resolve and preview both images.
		await expect( images ).toHaveCount( 2 );

		// With cropping enabled, both previewed images render at the same
		// height. Poll so the assertion waits for the images to load and the
		// layout to settle.
		await expect
			.poll( async () => {
				const firstBox = await images.nth( 0 ).boundingBox();
				const secondBox = await images.nth( 1 ).boundingBox();
				if ( ! firstBox || ! secondBox ) {
					return Number.POSITIVE_INFINITY;
				}
				return Math.abs( firstBox.height - secondBox.height );
			} )
			.toBeLessThanOrEqual( 1 );
	} );
} );

class GalleryBlockUtils {
	constructor( { page } ) {
		this.page = page;

		this.TEST_IMAGE_FILE_PATH = './assets/10x10_e2e_test_image_z9T8jK.png';
	}

	async upload( inputElement ) {
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-image-' )
		);
		const fileName = randomUUID();
		const tmpFileName = path.join( tmpDirectory, fileName + '.png' );
		await fs.copyFile( this.TEST_IMAGE_FILE_PATH, tmpFileName );

		await inputElement.setInputFiles( tmpFileName );

		return fileName;
	}
}
