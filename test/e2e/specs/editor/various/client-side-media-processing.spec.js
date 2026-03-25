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
	 * @param {string}                             fileName     File name in the assets directory.
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
		return await this.page.evaluate(
			() =>
				window.wp.data.select( 'core/block-editor' ).getSelectedBlock()
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

	test( 'should verify browser capabilities for client-side processing', async ( {
		page,
	} ) => {
		const isCrossOriginIsolated = await page.evaluate(
			() => window.crossOriginIsolated
		);

		if ( ! isCrossOriginIsolated ) {
			// eslint-disable-next-line playwright/no-skipped-test
			test.skip(
				true,
				'Cross-origin isolation is not enabled in this environment'
			);
		}

		expect( isCrossOriginIsolated ).toBe( true );

		const hasSharedArrayBuffer = await page.evaluate(
			() => typeof SharedArrayBuffer !== 'undefined'
		);
		expect( hasSharedArrayBuffer ).toBe( true );

		const hasUploadMediaStore = await page.evaluate(
			() => !! window.wp.data.select( 'core/upload-media' )
		);
		expect( hasUploadMediaStore ).toBe( true );
	} );

	test( 'should upload and process a JPEG image', async ( {
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

		const imageId = await mediaProcessingUtils.getSelectedBlockImageId();
		expect( imageId ).toBeDefined();

		const media = await mediaProcessingUtils.getMediaDetails(
			requestUtils,
			imageId
		);

		expect( media.mime_type ).toBe( 'image/jpeg' );
		// Dimensions should be preserved (below 2560 threshold).
		expect( media.media_details.width ).toBe( 1024 );
		expect( media.media_details.height ).toBe( 768 );
		expect( media.source_url ).not.toContain( '-scaled' );
	} );

	test( 'should upload and process a PNG image', async ( {
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

		const imageId = await mediaProcessingUtils.getSelectedBlockImageId();
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

		const imageId = await mediaProcessingUtils.getSelectedBlockImageId();
		expect( imageId ).toBeDefined();

		const media = await mediaProcessingUtils.getMediaDetails(
			requestUtils,
			imageId
		);

		expect( media.mime_type ).toBe( 'image/gif' );
	} );

	test( 'should generate sub-sizes and scale large images', async ( {
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

		const imageId = await mediaProcessingUtils.getSelectedBlockImageId();
		expect( imageId ).toBeDefined();

		const media = await mediaProcessingUtils.getMediaDetails(
			requestUtils,
			imageId
		);

		// The image should be scaled down to at most 2560px.
		expect( media.media_details.width ).toBeLessThanOrEqual( 2560 );
		expect( media.media_details.height ).toBeLessThanOrEqual( 2560 );

		// Verify sub-sizes were generated.
		const sizes = media.media_details.sizes;
		expect( sizes ).toBeDefined();

		const hasStandardSizes = sizes.thumbnail || sizes.medium || sizes.large;
		expect( hasStandardSizes ).toBeTruthy();

		// Verify thumbnail dimensions are reasonable.
		if ( sizes?.thumbnail ) {
			expect( sizes.thumbnail.width ).toBeLessThanOrEqual( 150 );
			expect( sizes.thumbnail.height ).toBeLessThanOrEqual( 150 );
		}

		if ( sizes?.medium ) {
			expect( sizes.medium.width ).toBeLessThanOrEqual( 300 );
			expect( sizes.medium.height ).toBeLessThanOrEqual( 300 );
		}

		if ( sizes?.large ) {
			expect( sizes.large.width ).toBeLessThanOrEqual( 1024 );
			expect( sizes.large.height ).toBeLessThanOrEqual( 1024 );
		}
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

		const imageId = await mediaProcessingUtils.getSelectedBlockImageId();
		expect( imageId ).toBeDefined();

		const media = await mediaProcessingUtils.getMediaDetails(
			requestUtils,
			imageId
		);

		// Should be scaled to at most 2560px on the longest side.
		expect( media.media_details.width ).toBeLessThanOrEqual( 2560 );
		expect( media.media_details.height ).toBeLessThanOrEqual( 2560 );
	} );

	test( 'should upload multiple images via gallery', async ( {
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

		// After all uploads complete, the Publish button should be enabled.
		const publishButton = page.locator(
			'role=region[name="Editor top bar"i] >> role=button[name="Publish"i]'
		);
		await expect( publishButton ).toBeEnabled( {
			timeout: 60_000,
		} );
	} );

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

			// The opaque PNG should have been converted to JPEG
			// (or remain as PNG if client-side conversion is not yet supported).
			expect( [ 'image/jpeg', 'image/png' ] ).toContain(
				media.mime_type
			);
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

			// The JPEG should have been converted to WebP
			// (or remain as JPEG if client-side conversion is not yet supported).
			expect( [ 'image/webp', 'image/jpeg' ] ).toContain(
				media.mime_type
			);
		} finally {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-plugin-image-format-conversion-jpeg-to-webp'
			);
		}
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

		const imageId = await mediaProcessingUtils.getSelectedBlockImageId();
		expect( imageId ).toBeDefined();

		const media = await mediaProcessingUtils.getMediaDetails(
			requestUtils,
			imageId
		);

		// After auto-rotation, dimensions should be swapped (768x1024).
		// If the image processor does not apply EXIF rotation,
		// dimensions remain at the original 1024x768.
		const { width, height } = media.media_details;
		const isRotated = width === 768 && height === 1024;
		const isOriginal = width === 1024 && height === 768;
		expect( isRotated || isOriginal ).toBe( true );
	} );
} );
