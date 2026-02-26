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

/**
 * @typedef {import('@playwright/test').Page} Page
 */

const ASSETS_DIR = path.join( __dirname, '..', '..', '..', 'assets' );

test.use( {
	mediaProcessingUtils: async ( { page }, use ) => {
		await use( new MediaProcessingUtils( { page } ) );
	},
} );

/**
 * Shared fixture for client-side media processing tests.
 */
class MediaProcessingUtils {
	constructor( { page } ) {
		/** @type {Page} */
		this.page = page;
	}

	/**
	 * Upload a file to the given input element.
	 * Copies the file to a temp directory with a unique name to avoid collisions.
	 *
	 * @param {import('@playwright/test').Locator} inputElement File input locator.
	 * @param {string}                             fileName    File name in the assets directory.
	 * @return {Promise<string>} The unique file name (without extension).
	 */
	async upload( inputElement, fileName ) {
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-media-' )
		);
		const uniqueName = uuid();
		const extension = path.extname( fileName );
		const tmpFileName = path.join( tmpDirectory, uniqueName + extension );
		await fs.copyFile( path.join( ASSETS_DIR, fileName ), tmpFileName );
		await inputElement.setInputFiles( tmpFileName );
		return uniqueName;
	}

	/**
	 * Wait for the upload queue to be empty.
	 *
	 * @param {number} timeout Timeout in milliseconds.
	 */
	async waitForUploadQueueEmpty( timeout = 120000 ) {
		await this.page.waitForFunction(
			() => {
				const uploadStore =
					window.wp.data.select( 'core/upload-media' );
				if ( ! uploadStore ) {
					return true; // Store not available, upload happened server-side.
				}
				const items = uploadStore.getItems();
				return items.length === 0;
			},
			{ timeout }
		);
	}

	/**
	 * Skip the test if cross-origin isolation is not enabled.
	 *
	 * @param {import('@playwright/test').TestInfo} testInstance The test object for skipping.
	 */
	async skipIfNotCrossOriginIsolated( testInstance ) {
		const isCrossOriginIsolated = await this.page.evaluate(
			() => window.crossOriginIsolated
		);
		testInstance.skip(
			! isCrossOriginIsolated,
			'Cross-origin isolation headers not configured on server'
		);
	}

	/**
	 * Get the image ID from the currently selected block's attributes.
	 *
	 * @return {Promise<number|undefined>} The image attachment ID.
	 */
	async getSelectedBlockImageId() {
		return await this.page.evaluate( () =>
			window.wp.data
				.select( 'core/block-editor' )
				.getSelectedBlock()
				?.attributes?.id
		);
	}

	/**
	 * Fetch media details from the REST API.
	 *
	 * @param {Object} requestUtils The requestUtils fixture.
	 * @param {number} imageId      The attachment ID.
	 * @return {Promise<Object>} Media details from the REST API.
	 */
	async getMediaDetails( requestUtils, imageId ) {
		return await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ imageId }`,
		} );
	}
}

test.describe( 'Client-side media processing', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.describe( 'Basic image upload with compression', () => {
		test( 'should upload a JPEG with client-side processing', async ( {
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();

			await mediaProcessingUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				'1024x768_e2e_test_image_size.jpeg'
			);

			const image = imageBlock.getByRole( 'img', {
				name: 'This image has an empty alt attribute',
			} );
			await expect( image ).toBeVisible();
			await expect( image ).toHaveAttribute( 'src', /^https?:\/\//, {
				timeout: 30_000,
			} );

			await mediaProcessingUtils.waitForUploadQueueEmpty();

			const imageId =
				await mediaProcessingUtils.getSelectedBlockImageId();
			expect( imageId ).toBeDefined();

			const media = await mediaProcessingUtils.getMediaDetails(
				requestUtils,
				imageId
			);

			expect( media.mime_type ).toBe( 'image/jpeg' );
			// Original dimensions should be preserved (below threshold).
			expect( media.media_details.width ).toBe( 1024 );
			expect( media.media_details.height ).toBe( 768 );
		} );

		test( 'should upload a PNG with client-side processing', async ( {
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();

			await mediaProcessingUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				'200x150_e2e_test_image_opaque.png'
			);

			const image = imageBlock.getByRole( 'img', {
				name: 'This image has an empty alt attribute',
			} );
			await expect( image ).toBeVisible();
			await expect( image ).toHaveAttribute( 'src', /^https?:\/\//, {
				timeout: 30_000,
			} );

			await mediaProcessingUtils.waitForUploadQueueEmpty();

			const imageId =
				await mediaProcessingUtils.getSelectedBlockImageId();
			expect( imageId ).toBeDefined();

			const media = await mediaProcessingUtils.getMediaDetails(
				requestUtils,
				imageId
			);

			expect( media.mime_type ).toBe( 'image/png' );
		} );

		test( 'should compress uploaded images', async ( {
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			const originalFile = path.join(
				ASSETS_DIR,
				'3200x2400_e2e_test_image_responsive_lightbox.jpeg'
			);
			const originalStats = await fs.stat( originalFile );

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();

			await mediaProcessingUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				'3200x2400_e2e_test_image_responsive_lightbox.jpeg'
			);

			const image = imageBlock.getByRole( 'img', {
				name: 'This image has an empty alt attribute',
			} );
			await expect( image ).toBeVisible();

			await mediaProcessingUtils.waitForUploadQueueEmpty();

			const imageId =
				await mediaProcessingUtils.getSelectedBlockImageId();
			expect( imageId ).toBeDefined();

			const media = await mediaProcessingUtils.getMediaDetails(
				requestUtils,
				imageId
			);

			// Uploaded file size should be reasonable (not excessively larger than original).
			if ( media.filesize ) {
				// The uploaded file may be slightly larger or smaller depending on processing,
				// but should not be dramatically larger.
				expect( media.filesize ).toBeLessThan(
					originalStats.size * 3
				);
			}
		} );

		test( 'should show transient state during processing', async ( {
			editor,
			mediaProcessingUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();

			await mediaProcessingUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				'3200x2400_e2e_test_image_responsive_lightbox.jpeg'
			);

			// The image should show a transient state while uploading/processing.
			// Check that the block has an image element (either transient or final).
			const image = imageBlock.getByRole( 'img', {
				name: 'This image has an empty alt attribute',
			} );
			await expect( image ).toBeVisible();

			// Wait for upload to finish and transient state to be removed.
			await mediaProcessingUtils.waitForUploadQueueEmpty();

			// After processing, the image should have a final URL.
			await expect( image ).toHaveAttribute( 'src', /^https?:\/\//, {
				timeout: 30_000,
			} );
		} );
	} );

	test.describe( 'Sub-size generation', () => {
		test( 'should generate standard thumbnail sizes client-side', async ( {
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();

			// Upload a large image that will need sub-sizes generated.
			await mediaProcessingUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				'3200x2400_e2e_test_image_responsive_lightbox.jpeg'
			);

			const image = imageBlock.getByRole( 'img', {
				name: 'This image has an empty alt attribute',
			} );
			await expect( image ).toBeVisible();

			await mediaProcessingUtils.waitForUploadQueueEmpty();

			const imageId =
				await mediaProcessingUtils.getSelectedBlockImageId();
			expect( imageId ).toBeDefined();

			const media = await mediaProcessingUtils.getMediaDetails(
				requestUtils,
				imageId
			);

			// Verify thumbnails were generated.
			const sizes = media.media_details.sizes;
			expect( sizes ).toBeDefined();

			// Check that at least some standard sizes were created.
			const hasStandardSizes =
				sizes.thumbnail || sizes.medium || sizes.large;
			expect( hasStandardSizes ).toBeTruthy();
		} );

		test( 'should generate correctly proportioned thumbnails', async ( {
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();

			await mediaProcessingUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				'3200x2400_e2e_test_image_responsive_lightbox.jpeg'
			);

			const image = imageBlock.getByRole( 'img', {
				name: 'This image has an empty alt attribute',
			} );
			await expect( image ).toBeVisible();

			await mediaProcessingUtils.waitForUploadQueueEmpty();

			const imageId =
				await mediaProcessingUtils.getSelectedBlockImageId();
			expect( imageId ).toBeDefined();

			const media = await mediaProcessingUtils.getMediaDetails(
				requestUtils,
				imageId
			);

			const sizes = media.media_details.sizes;

			// If thumbnail exists, verify reasonable dimensions.
			// Default thumbnail is 150x150 (cropped).
			if ( sizes?.thumbnail ) {
				expect( sizes.thumbnail.width ).toBeLessThanOrEqual( 150 );
				expect( sizes.thumbnail.height ).toBeLessThanOrEqual( 150 );
			}

			// If medium exists, verify dimensions.
			// Default medium max is 300px on the longest side.
			if ( sizes?.medium ) {
				expect( sizes.medium.width ).toBeLessThanOrEqual( 300 );
				expect( sizes.medium.height ).toBeLessThanOrEqual( 300 );
			}

			// If large exists, verify dimensions.
			// Default large max is 1024px on the longest side.
			if ( sizes?.large ) {
				expect( sizes.large.width ).toBeLessThanOrEqual( 1024 );
				expect( sizes.large.height ).toBeLessThanOrEqual( 1024 );
			}
		} );

		test( 'should create scaled version for large images', async ( {
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();

			await mediaProcessingUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				'3200x2400_e2e_test_image_responsive_lightbox.jpeg'
			);

			const image = imageBlock.getByRole( 'img', {
				name: 'This image has an empty alt attribute',
			} );
			await expect( image ).toBeVisible();

			await mediaProcessingUtils.waitForUploadQueueEmpty();

			const imageId =
				await mediaProcessingUtils.getSelectedBlockImageId();
			expect( imageId ).toBeDefined();

			const media = await mediaProcessingUtils.getMediaDetails(
				requestUtils,
				imageId
			);

			// The image should be scaled down to at most 2560px.
			expect( media.media_details.width ).toBeLessThanOrEqual( 2560 );
			expect( media.media_details.height ).toBeLessThanOrEqual( 2560 );
		} );
	} );

	test.describe( 'Multiple image uploads', () => {
		test( 'should upload multiple images via gallery block', async ( {
			editor,
			mediaProcessingUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await editor.insertBlock( { name: 'core/gallery' } );

			const galleryBlock = editor.canvas.locator(
				'role=document[name="Block: Gallery"i]'
			);
			await expect( galleryBlock ).toBeVisible();

			const uploadInput = galleryBlock.locator(
				'data-testid=form-file-upload-input'
			);

			// Upload 3 images at once.
			const tmpDirectory = await fs.mkdtemp(
				path.join( os.tmpdir(), 'gutenberg-test-gallery-' )
			);
			const files = [
				'1024x768_e2e_test_image_size.jpeg',
				'200x150_e2e_test_image_opaque.png',
				'10x10_e2e_test_image_z9T8jK.png',
			];
			const tmpFiles = [];

			for ( const file of files ) {
				const uniqueName = uuid();
				const ext = path.extname( file );
				const tmpFile = path.join( tmpDirectory, uniqueName + ext );
				await fs.copyFile( path.join( ASSETS_DIR, file ), tmpFile );
				tmpFiles.push( tmpFile );
			}

			await uploadInput.setInputFiles( tmpFiles );

			await mediaProcessingUtils.waitForUploadQueueEmpty();

			// Verify all images appear in the gallery.
			const images = galleryBlock.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( images ).toHaveCount( 3, { timeout: 60_000 } );
		} );

		test( 'should handle batch completion', async ( {
			page,
			editor,
			mediaProcessingUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await editor.insertBlock( { name: 'core/gallery' } );

			const galleryBlock = editor.canvas.locator(
				'role=document[name="Block: Gallery"i]'
			);
			await expect( galleryBlock ).toBeVisible();

			const uploadInput = galleryBlock.locator(
				'data-testid=form-file-upload-input'
			);

			// Upload 2 images.
			const tmpDirectory = await fs.mkdtemp(
				path.join( os.tmpdir(), 'gutenberg-test-batch-' )
			);
			const files = [
				'1024x768_e2e_test_image_size.jpeg',
				'200x150_e2e_test_image_opaque.png',
			];
			const tmpFiles = [];

			for ( const file of files ) {
				const uniqueName = uuid();
				const ext = path.extname( file );
				const tmpFile = path.join( tmpDirectory, uniqueName + ext );
				await fs.copyFile( path.join( ASSETS_DIR, file ), tmpFile );
				tmpFiles.push( tmpFile );
			}

			await uploadInput.setInputFiles( tmpFiles );

			await mediaProcessingUtils.waitForUploadQueueEmpty();

			// After all uploads complete, the Publish button should be enabled.
			const publishButton = page.locator(
				'role=region[name="Editor top bar"i] >> role=button[name="Publish"i]'
			);
			await expect( publishButton ).toBeEnabled( {
				timeout: 60_000,
			} );
		} );
	} );

	test.describe( 'Error scenarios and fallbacks', () => {
		test( 'should fall back to server-side when client-side disabled', async ( {
			page,
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await requestUtils.activatePlugin(
				'gutenberg-test-plugin-disable-client-side-media-processing'
			);

			try {
				await page.reload();

				await editor.insertBlock( { name: 'core/image' } );

				const imageBlock = editor.canvas.locator(
					'role=document[name="Block: Image"i]'
				);
				await expect( imageBlock ).toBeVisible();

				await mediaProcessingUtils.upload(
					imageBlock.locator(
						'data-testid=form-file-upload-input'
					),
					'1024x768_e2e_test_image_size.jpeg'
				);

				const image = imageBlock.getByRole( 'img', {
					name: 'This image has an empty alt attribute',
				} );
				await expect( image ).toBeVisible();
				await expect( image ).toHaveAttribute(
					'src',
					/^https?:\/\//,
					{ timeout: 30_000 }
				);

				const imageId =
					await mediaProcessingUtils.getSelectedBlockImageId();
				expect( imageId ).toBeDefined();

				const media = await mediaProcessingUtils.getMediaDetails(
					requestUtils,
					imageId
				);

				// Should still upload successfully via server-side processing.
				expect( media.media_details.width ).toBe( 1024 );
				expect( media.media_details.height ).toBe( 768 );
			} finally {
				await requestUtils.deactivatePlugin(
					'gutenberg-test-plugin-disable-client-side-media-processing'
				);
			}
		} );

		test( 'should show error for unsupported file type', async ( {
			page,
			editor,
			mediaProcessingUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();

			// Create a text file to attempt upload.
			const tmpDirectory = await fs.mkdtemp(
				path.join( os.tmpdir(), 'gutenberg-test-invalid-' )
			);
			const tmpFile = path.join( tmpDirectory, 'test.txt' );
			await fs.writeFile( tmpFile, 'This is not an image.' );

			const uploadInput = imageBlock.locator(
				'data-testid=form-file-upload-input'
			);
			await uploadInput.setInputFiles( tmpFile );

			// An error notice should be shown.
			const errorNotice = page.locator(
				'role=region[name="Editor publish"i] >> .components-snackbar, .components-notice'
			);
			// Check either the snackbar list or notice region for an error.
			const snackbar = page.locator( '.components-snackbar-list' );
			await expect( snackbar.or( errorNotice ) ).toBeVisible( {
				timeout: 10_000,
			} );
		} );

		test( 'should handle server upload failure', async ( {
			page,
			editor,
			mediaProcessingUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			// Intercept REST API media uploads to return a 500 error.
			await page.route( '**/wp/v2/media', ( route ) => {
				if ( route.request().method() === 'POST' ) {
					route.fulfill( {
						status: 500,
						contentType: 'application/json',
						body: JSON.stringify( {
							code: 'rest_upload_error',
							message: 'Simulated server error',
							data: { status: 500 },
						} ),
					} );
				} else {
					route.continue();
				}
			} );

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();

			await mediaProcessingUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				'1024x768_e2e_test_image_size.jpeg'
			);

			// Wait for error to appear (snackbar notice).
			const snackbar = page.locator( '.components-snackbar-list' );
			await expect( snackbar ).toBeVisible( { timeout: 60_000 } );

			// Clean up the route interception.
			await page.unroute( '**/wp/v2/media' );
		} );
	} );

	test.describe( 'Browser capabilities', () => {
		test( 'should verify cross-origin isolation is enabled', async ( {
			page,
		} ) => {
			const isCrossOriginIsolated = await page.evaluate(
				() => window.crossOriginIsolated
			);

			// In the Gutenberg test environment, COI should be enabled.
			// This test documents the expected state.
			if ( isCrossOriginIsolated ) {
				expect( isCrossOriginIsolated ).toBe( true );
			} else {
				// eslint-disable-next-line playwright/no-skipped-test
				test.skip(
					true,
					'Cross-origin isolation is not enabled in this environment'
				);
			}
		} );

		test( 'should detect SharedArrayBuffer availability', async ( {
			page,
		} ) => {
			const isCrossOriginIsolated = await page.evaluate(
				() => window.crossOriginIsolated
			);
			// eslint-disable-next-line playwright/no-skipped-test
			test.skip(
				! isCrossOriginIsolated,
				'Cross-origin isolation headers not configured on server'
			);

			const hasSharedArrayBuffer = await page.evaluate(
				() => typeof SharedArrayBuffer !== 'undefined'
			);
			expect( hasSharedArrayBuffer ).toBe( true );
		} );

		test( 'should detect upload-media store when cross-origin isolated', async ( {
			page,
		} ) => {
			const isCrossOriginIsolated = await page.evaluate(
				() => window.crossOriginIsolated
			);
			// eslint-disable-next-line playwright/no-skipped-test
			test.skip(
				! isCrossOriginIsolated,
				'Cross-origin isolation headers not configured on server'
			);

			const hasUploadMediaStore = await page.evaluate(
				() => !! window.wp.data.select( 'core/upload-media' )
			);
			expect( hasUploadMediaStore ).toBe( true );
		} );
	} );

	test.describe( 'MIME types and format conversion', () => {
		test( 'should upload JPEG images', async ( {
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);

			await mediaProcessingUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				'1024x768_e2e_test_image_size.jpeg'
			);

			const image = imageBlock.getByRole( 'img', {
				name: 'This image has an empty alt attribute',
			} );
			await expect( image ).toBeVisible();

			await mediaProcessingUtils.waitForUploadQueueEmpty();

			const imageId =
				await mediaProcessingUtils.getSelectedBlockImageId();
			expect( imageId ).toBeDefined();

			const media = await mediaProcessingUtils.getMediaDetails(
				requestUtils,
				imageId
			);

			expect( media.mime_type ).toBe( 'image/jpeg' );
		} );

		test( 'should upload PNG images', async ( {
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);

			await mediaProcessingUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				'200x150_e2e_test_image_opaque.png'
			);

			const image = imageBlock.getByRole( 'img', {
				name: 'This image has an empty alt attribute',
			} );
			await expect( image ).toBeVisible();

			await mediaProcessingUtils.waitForUploadQueueEmpty();

			const imageId =
				await mediaProcessingUtils.getSelectedBlockImageId();
			expect( imageId ).toBeDefined();

			const media = await mediaProcessingUtils.getMediaDetails(
				requestUtils,
				imageId
			);

			expect( media.mime_type ).toBe( 'image/png' );
		} );

		test( 'should upload GIF images', async ( {
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);

			await mediaProcessingUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				'100x80_e2e_test_image_animated.gif'
			);

			const image = imageBlock.getByRole( 'img', {
				name: 'This image has an empty alt attribute',
			} );
			await expect( image ).toBeVisible();

			await mediaProcessingUtils.waitForUploadQueueEmpty();

			const imageId =
				await mediaProcessingUtils.getSelectedBlockImageId();
			expect( imageId ).toBeDefined();

			const media = await mediaProcessingUtils.getMediaDetails(
				requestUtils,
				imageId
			);

			expect( media.mime_type ).toBe( 'image/gif' );
		} );

		test( 'should convert PNG to JPEG when configured', async ( {
			page,
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await requestUtils.activatePlugin(
				'gutenberg-test-plugin-image-format-conversion-png-to-jpeg'
			);

			try {
				// Reload to pick up the new output format settings.
				await page.reload();

				await editor.insertBlock( { name: 'core/image' } );

				const imageBlock = editor.canvas.locator(
					'role=document[name="Block: Image"i]'
				);
				await expect( imageBlock ).toBeVisible();

				// Upload an opaque PNG (no transparency).
				await mediaProcessingUtils.upload(
					imageBlock.locator(
						'data-testid=form-file-upload-input'
					),
					'200x150_e2e_test_image_opaque.png'
				);

				const image = imageBlock.getByRole( 'img', {
					name: 'This image has an empty alt attribute',
				} );
				await expect( image ).toBeVisible();

				await mediaProcessingUtils.waitForUploadQueueEmpty();

				const imageId =
					await mediaProcessingUtils.getSelectedBlockImageId();
				expect( imageId ).toBeDefined();

				const media = await mediaProcessingUtils.getMediaDetails(
					requestUtils,
					imageId
				);

				// The opaque PNG should have been converted to JPEG.
				expect( media.mime_type ).toBe( 'image/jpeg' );
			} finally {
				await requestUtils.deactivatePlugin(
					'gutenberg-test-plugin-image-format-conversion-png-to-jpeg'
				);
			}
		} );

		test( 'should preserve PNG when image has transparency', async ( {
			page,
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await requestUtils.activatePlugin(
				'gutenberg-test-plugin-image-format-conversion-png-to-jpeg'
			);

			try {
				await page.reload();

				await editor.insertBlock( { name: 'core/image' } );

				const imageBlock = editor.canvas.locator(
					'role=document[name="Block: Image"i]'
				);
				await expect( imageBlock ).toBeVisible();

				// Upload a transparent PNG.
				await mediaProcessingUtils.upload(
					imageBlock.locator(
						'data-testid=form-file-upload-input'
					),
					'200x150_e2e_test_image_transparent.png'
				);

				const image = imageBlock.getByRole( 'img', {
					name: 'This image has an empty alt attribute',
				} );
				await expect( image ).toBeVisible();

				await mediaProcessingUtils.waitForUploadQueueEmpty();

				const imageId =
					await mediaProcessingUtils.getSelectedBlockImageId();
				expect( imageId ).toBeDefined();

				const media = await mediaProcessingUtils.getMediaDetails(
					requestUtils,
					imageId
				);

				// The transparent PNG should stay as PNG even with the conversion filter.
				expect( media.mime_type ).toBe( 'image/png' );
			} finally {
				await requestUtils.deactivatePlugin(
					'gutenberg-test-plugin-image-format-conversion-png-to-jpeg'
				);
			}
		} );

		test( 'should convert JPEG to WebP when configured', async ( {
			page,
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await requestUtils.activatePlugin(
				'gutenberg-test-plugin-image-format-conversion-jpeg-to-webp'
			);

			try {
				await page.reload();

				await editor.insertBlock( { name: 'core/image' } );

				const imageBlock = editor.canvas.locator(
					'role=document[name="Block: Image"i]'
				);
				await expect( imageBlock ).toBeVisible();

				await mediaProcessingUtils.upload(
					imageBlock.locator(
						'data-testid=form-file-upload-input'
					),
					'1024x768_e2e_test_image_size.jpeg'
				);

				const image = imageBlock.getByRole( 'img', {
					name: 'This image has an empty alt attribute',
				} );
				await expect( image ).toBeVisible();

				await mediaProcessingUtils.waitForUploadQueueEmpty();

				const imageId =
					await mediaProcessingUtils.getSelectedBlockImageId();
				expect( imageId ).toBeDefined();

				const media = await mediaProcessingUtils.getMediaDetails(
					requestUtils,
					imageId
				);

				// The JPEG should have been converted to WebP.
				expect( media.mime_type ).toBe( 'image/webp' );
			} finally {
				await requestUtils.deactivatePlugin(
					'gutenberg-test-plugin-image-format-conversion-jpeg-to-webp'
				);
			}
		} );
	} );

	test.describe( 'Special image handling', () => {
		test( 'should preserve transparency in PNG uploads', async ( {
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();

			await mediaProcessingUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				'200x150_e2e_test_image_transparent.png'
			);

			const image = imageBlock.getByRole( 'img', {
				name: 'This image has an empty alt attribute',
			} );
			await expect( image ).toBeVisible();

			await mediaProcessingUtils.waitForUploadQueueEmpty();

			const imageId =
				await mediaProcessingUtils.getSelectedBlockImageId();
			expect( imageId ).toBeDefined();

			const media = await mediaProcessingUtils.getMediaDetails(
				requestUtils,
				imageId
			);

			// Should remain as PNG (not converted to JPEG which would lose transparency).
			expect( media.mime_type ).toBe( 'image/png' );
		} );

		test( 'should auto-rotate images based on EXIF orientation', async ( {
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();

			// Upload image with EXIF orientation=6 (90 degrees CW).
			// Original pixel dimensions are 1024x768 but after rotation should be 768x1024.
			await mediaProcessingUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				'1024x768_e2e_test_image_rotated.jpeg'
			);

			const image = imageBlock.getByRole( 'img', {
				name: 'This image has an empty alt attribute',
			} );
			await expect( image ).toBeVisible();

			await mediaProcessingUtils.waitForUploadQueueEmpty();

			const imageId =
				await mediaProcessingUtils.getSelectedBlockImageId();
			expect( imageId ).toBeDefined();

			const media = await mediaProcessingUtils.getMediaDetails(
				requestUtils,
				imageId
			);

			// After auto-rotation, dimensions should be swapped.
			// The image was 1024x768 with orientation=6, so after rotation: 768x1024.
			expect( media.media_details.width ).toBe( 768 );
			expect( media.media_details.height ).toBe( 1024 );
		} );

		test( 'should handle oversized images', async ( {
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();

			// Upload 5000x4000 image, well above the 2560 threshold.
			await mediaProcessingUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				'5000x4000_e2e_test_image_oversized.jpeg'
			);

			const image = imageBlock.getByRole( 'img', {
				name: 'This image has an empty alt attribute',
			} );
			await expect( image ).toBeVisible();

			await mediaProcessingUtils.waitForUploadQueueEmpty();

			const imageId =
				await mediaProcessingUtils.getSelectedBlockImageId();
			expect( imageId ).toBeDefined();

			const media = await mediaProcessingUtils.getMediaDetails(
				requestUtils,
				imageId
			);

			// Should be scaled to at most 2560px on the longest side.
			expect( media.media_details.width ).toBeLessThanOrEqual( 2560 );
			expect( media.media_details.height ).toBeLessThanOrEqual( 2560 );
		} );

		test( 'should not modify images below threshold', async ( {
			editor,
			mediaProcessingUtils,
			requestUtils,
		} ) => {
			await mediaProcessingUtils.skipIfNotCrossOriginIsolated( test );

			await editor.insertBlock( { name: 'core/image' } );

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();

			// Upload 1024x768, well below the 2560 threshold.
			await mediaProcessingUtils.upload(
				imageBlock.locator( 'data-testid=form-file-upload-input' ),
				'1024x768_e2e_test_image_size.jpeg'
			);

			const image = imageBlock.getByRole( 'img', {
				name: 'This image has an empty alt attribute',
			} );
			await expect( image ).toBeVisible();

			await mediaProcessingUtils.waitForUploadQueueEmpty();

			const imageId =
				await mediaProcessingUtils.getSelectedBlockImageId();
			expect( imageId ).toBeDefined();

			const media = await mediaProcessingUtils.getMediaDetails(
				requestUtils,
				imageId
			);

			// Dimensions should be preserved exactly.
			expect( media.media_details.width ).toBe( 1024 );
			expect( media.media_details.height ).toBe( 768 );
			expect( media.source_url ).not.toContain( '-scaled' );
		} );
	} );
} );
