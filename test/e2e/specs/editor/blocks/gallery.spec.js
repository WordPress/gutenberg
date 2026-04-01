/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs/promises' );
const os = require( 'os' );
const { v4: uuid } = require( 'uuid' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	galleryBlockUtils: async ( { page }, use ) => {
		await use( new GalleryBlockUtils( { page } ) );
	},
} );

test.describe( 'Gallery', () => {
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
			.locator( 'role=button[name="Add default block"i]' )
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

		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Undo"i]'
		);

		await expect.poll( editor.getEditedPostContent ).toBe( '' );

		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Redo"i]'
		);

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
} );

function defer() {
	let resolve;
	const promise = new Promise( ( r ) => {
		resolve = r;
	} );
	promise.resolve = resolve;
	return promise;
}

// The gallery batch upload overlay requires client-side media processing
// (which populates the upload-media store). Client-side media processing
// depends on SharedArrayBuffer / cross-origin isolation, which may not be
// available in all e2e test environments.
// These tests are skipped until cross-origin isolation is reliably available.
// eslint-disable-next-line playwright/no-skipped-test
test.describe.skip( 'Gallery - upload progress overlay', () => {
	test.use( {
		galleryBlockUtils: async ( { page }, use ) => {
			await use( new GalleryBlockUtils( { page } ) );
		},
	} );

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'shows consolidated progress overlay for batch uploads', async ( {
		editor,
		page,
		galleryBlockUtils,
	} ) => {
		const deferred = defer();

		// Intercept media uploads to hold them in-flight.
		await page.route(
			( url ) => url.pathname.includes( '/wp/v2/media' ),
			async ( route, request ) => {
				if ( request.method() === 'POST' ) {
					await deferred;
					await route.continue();
				} else {
					await route.continue();
				}
			}
		);

		await editor.insertBlock( { name: 'core/gallery' } );
		const galleryBlock = editor.canvas.locator(
			'role=document[name="Block: Gallery"i]'
		);
		await expect( galleryBlock ).toBeVisible();

		// Upload multiple files to trigger the batch overlay.
		await galleryBlockUtils.uploadMultiple(
			galleryBlock.locator( 'data-testid=form-file-upload-input' ),
			3
		);

		// The consolidated gallery overlay should appear.
		const overlay = editor.canvas.locator(
			'.wp-block-gallery__upload-overlay'
		);
		await expect( overlay ).toBeVisible( { timeout: 10_000 } );

		// Individual image overlays should NOT be shown inside the gallery.
		await expect(
			galleryBlock.locator( '.wp-block-image__upload-overlay' )
		).toHaveCount( 0 );

		// Release the uploads.
		deferred.resolve();

		// Gallery overlay should disappear after all uploads complete.
		await expect( overlay ).toBeHidden( { timeout: 30_000 } );
	} );
} );

class GalleryBlockUtils {
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
		const fileName = uuid();
		const tmpFileName = path.join( tmpDirectory, fileName + '.png' );
		await fs.copyFile( this.TEST_IMAGE_FILE_PATH, tmpFileName );

		await inputElement.setInputFiles( tmpFileName );

		return fileName;
	}

	async uploadMultiple( inputElement, count ) {
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-gallery-' )
		);
		const fileNames = [];
		const filePaths = [];
		for ( let i = 0; i < count; i++ ) {
			const fileName = uuid();
			const tmpFileName = path.join( tmpDirectory, fileName + '.png' );
			await fs.copyFile( this.TEST_IMAGE_FILE_PATH, tmpFileName );
			fileNames.push( fileName );
			filePaths.push( tmpFileName );
		}

		await inputElement.setInputFiles( filePaths );

		return fileNames;
	}
}
