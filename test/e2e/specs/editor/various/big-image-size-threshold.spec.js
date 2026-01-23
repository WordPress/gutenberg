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

test.use( {
	imageBlockUtils: async ( { page }, use ) => {
		await use( new ImageBlockUtils( { page } ) );
	},
} );

test.describe( 'Big image size threshold', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'should scale down images larger than the threshold', async ( {
		page,
		editor,
		imageBlockUtils,
		requestUtils,
	} ) => {
		// Skip if cross-origin isolation is not enabled.
		// The vips library requires SharedArrayBuffer which needs cross-origin isolation.
		const isCrossOriginIsolated = await page.evaluate(
			() => window.crossOriginIsolated
		);
		// eslint-disable-next-line playwright/no-skipped-test
		test.skip(
			! isCrossOriginIsolated,
			'Cross-origin isolation headers not configured on server'
		);

		// Verify the big image size threshold setting is available.
		const threshold = await page.evaluate( () =>
			window.wp.data
				.select( 'core' )
				.getEntityRecord( 'root', '__unstableBase' )
		);
		expect( threshold?.image_size_threshold ).toBeDefined();

		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		// Upload a large image (3200x2400) that exceeds the default threshold (2560).
		await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' ),
			'3200x2400_e2e_test_image_responsive_lightbox.jpeg'
		);

		// Wait for the upload to complete.
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toBeVisible();

		// Wait for the image URL to be updated to the final uploaded URL.
		await page.waitForFunction(
			() => {
				const uploadStore =
					window.wp.data.select( 'core/upload-media' );
				if ( ! uploadStore ) {
					return true; // Store not available, upload happened server-side.
				}
				const items = uploadStore.getItems();
				return items.length === 0;
			},
			{ timeout: 120000 }
		);

		// Get the image ID from the block.
		const imageId = await page.evaluate(
			() =>
				window.wp.data.select( 'core/block-editor' ).getSelectedBlock()
					?.attributes?.id
		);

		if ( imageId ) {
			// Fetch the attachment details from the REST API.
			const media = await requestUtils.rest( {
				method: 'GET',
				path: `/wp/v2/media/${ imageId }`,
			} );

			// When client-side thumbnail generation is enabled and cross-origin isolation
			// is available, the image should be scaled down and have the -scaled suffix.
			if ( media.source_url.includes( '-scaled' ) ) {
				// Verify the image was scaled down.
				expect( media.media_details.width ).toBeLessThanOrEqual( 2560 );
				expect( media.media_details.height ).toBeLessThanOrEqual(
					2560
				);
				expect( media.source_url ).toContain( '-scaled' );

				// Verify original_image is preserved in metadata.
				// WordPress core stores the original filename when scaling.
				expect( media.media_details.original_image ).toBeDefined();

				// Verify thumbnails were generated.
				// WordPress core generates thumbnails from the original image for quality.
				const sizes = media.media_details.sizes;
				expect( sizes ).toBeDefined();

				// Check that at least some standard sizes were created.
				// The exact sizes depend on theme/site configuration.
				const hasStandardSizes =
					sizes.thumbnail || sizes.medium || sizes.large;
				expect( hasStandardSizes ).toBeTruthy();

				// If thumbnail exists, verify it has reasonable dimensions.
				// Default thumbnail size is 150x150.
				if ( sizes.thumbnail ) {
					expect( sizes.thumbnail.width ).toBeLessThanOrEqual( 150 );
					expect( sizes.thumbnail.height ).toBeLessThanOrEqual( 150 );
				}

				// If medium exists, verify dimensions.
				// Default medium size is 300x300.
				if ( sizes.medium ) {
					expect( sizes.medium.width ).toBeLessThanOrEqual( 300 );
					expect( sizes.medium.height ).toBeLessThanOrEqual( 300 );
				}
			} else {
				// If server-side processing happened, the image should still be
				// scaled down to the threshold.
				expect( media.media_details.width ).toBeLessThanOrEqual( 2560 );
				expect( media.media_details.height ).toBeLessThanOrEqual(
					2560
				);
			}
		}
	} );

	test( 'should not scale images smaller than the threshold', async ( {
		page,
		editor,
		imageBlockUtils,
		requestUtils,
	} ) => {
		// Skip if cross-origin isolation is not enabled.
		const isCrossOriginIsolated = await page.evaluate(
			() => window.crossOriginIsolated
		);
		// eslint-disable-next-line playwright/no-skipped-test
		test.skip(
			! isCrossOriginIsolated,
			'Cross-origin isolation headers not configured on server'
		);

		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		// Upload a small image (1024x768) that is below the default threshold (2560).
		await imageBlockUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' ),
			'1024x768_e2e_test_image_size.jpeg'
		);

		// Wait for the upload to complete.
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toBeVisible();

		// Wait for the upload queue to be empty.
		await page.waitForFunction(
			() => {
				const uploadStore =
					window.wp.data.select( 'core/upload-media' );
				if ( ! uploadStore ) {
					return true;
				}
				const items = uploadStore.getItems();
				return items.length === 0;
			},
			{ timeout: 120000 }
		);

		// Get the image ID from the block.
		const imageId = await page.evaluate(
			() =>
				window.wp.data.select( 'core/block-editor' ).getSelectedBlock()
					?.attributes?.id
		);

		if ( imageId ) {
			// Fetch the attachment details from the REST API.
			const media = await requestUtils.rest( {
				method: 'GET',
				path: `/wp/v2/media/${ imageId }`,
			} );

			// The image should NOT be scaled since it's below the threshold.
			expect( media.source_url ).not.toContain( '-scaled' );
			// Original dimensions should be preserved.
			expect( media.media_details.width ).toBe( 1024 );
			expect( media.media_details.height ).toBe( 768 );
		}
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
		const fileName = uuid();
		const extension = customFile ? path.extname( customFile ) : '.png';
		const tmpFileName = path.join( tmpDirectory, fileName + extension );
		const filePath = customFile
			? path.join( this.basePath, customFile )
			: this.TEST_IMAGE_FILE_PATH;
		await fs.copyFile( filePath, tmpFileName );

		await inputElement.setInputFiles( tmpFileName );

		return fileName;
	}
}
