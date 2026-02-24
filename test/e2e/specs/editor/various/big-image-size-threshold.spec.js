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

/**
 * Waits for the upload queue to drain and returns the attachment ID
 * from the currently selected image block.
 *
 * @param {Page} page Playwright page object.
 * @return {Promise<number>} The attachment ID.
 */
async function waitForUploadAndGetImageId( page ) {
	// Wait for the upload queue to be empty.
	await page.waitForFunction(
		() => {
			const uploadStore = window.wp.data.select( 'core/upload-media' );
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

	expect( imageId ).toBeTruthy();
	return imageId;
}

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

	test( 'should preserve original filename through client-side upload', async ( {
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

		// Upload with a specific filename to verify it is preserved
		// through the cross-realm File handling in convertBlobToFile().
		await imageBlockUtils.uploadWithName(
			imageBlock.locator( 'data-testid=form-file-upload-input' ),
			'1024x768_e2e_test_image_size.jpeg',
			'my-vacation-photo.jpeg'
		);

		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toBeVisible();

		const imageId = await waitForUploadAndGetImageId( page );

		const media = await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ imageId }`,
		} );

		// The uploaded filename should be preserved in the source URL.
		expect( media.source_url ).toContain( 'my-vacation-photo' );
	} );

	test( 'should create scaled version with original_image metadata for large images', async ( {
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
		await imageBlockUtils.uploadWithName(
			imageBlock.locator( 'data-testid=form-file-upload-input' ),
			'3200x2400_e2e_test_image_responsive_lightbox.jpeg',
			'landscape-photo.jpeg'
		);

		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toBeVisible();

		const imageId = await waitForUploadAndGetImageId( page );

		const media = await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ imageId }`,
		} );

		// The scaled version should be set as the main image.
		expect( media.source_url ).toContain( '-scaled' );

		// The original_image metadata should be set to the unscaled filename.
		expect( media.media_details.original_image ).toBe(
			'landscape-photo.jpeg'
		);

		// The scaled image should be within the threshold dimensions.
		expect( media.media_details.width ).toBeLessThanOrEqual( 2560 );
		expect( media.media_details.height ).toBeLessThanOrEqual( 2560 );

		// The max dimension should be exactly 2560 (the default threshold).
		const maxDimension = Math.max(
			media.media_details.width,
			media.media_details.height
		);
		expect( maxDimension ).toBe( 2560 );

		// The scaled filename should not have a numeric suffix (e.g. -scaled-1).
		// This verifies the regex fix for filter_wp_unique_filename().
		expect( media.source_url ).not.toMatch( /-scaled-\d+/ );
	} );

	test( 'should generate thumbnails with correct base filename', async ( {
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

		// Upload a large image with a known filename.
		await imageBlockUtils.uploadWithName(
			imageBlock.locator( 'data-testid=form-file-upload-input' ),
			'3200x2400_e2e_test_image_responsive_lightbox.jpeg',
			'my-photo.jpeg'
		);

		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toBeVisible();

		const imageId = await waitForUploadAndGetImageId( page );

		const media = await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ imageId }`,
		} );

		// Verify thumbnails were generated.
		const sizes = media.media_details.sizes;
		expect( sizes ).toBeDefined();

		// Check that at least some standard sizes were created.
		const hasStandardSizes = sizes.thumbnail || sizes.medium || sizes.large;
		expect( hasStandardSizes ).toBeTruthy();

		// Verify thumbnail filenames use the correct base filename (my-photo),
		// not a UUID or wrong name. This validates the attachment.filename fix
		// in generateThumbnails().
		const sizeEntries = Object.entries( sizes );
		for ( const [ sizeName, sizeData ] of sizeEntries ) {
			if ( sizeName === 'full' ) {
				continue;
			}
			// Each thumbnail file should start with "my-photo-".
			expect( sizeData.file ).toMatch( /^my-photo-/ );
		}

		// Verify the scaled version filename.
		expect( media.source_url ).toContain( 'my-photo-scaled' );
	} );

	test( 'should not scale or set original_image for images below threshold', async ( {
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
		await imageBlockUtils.uploadWithName(
			imageBlock.locator( 'data-testid=form-file-upload-input' ),
			'1024x768_e2e_test_image_size.jpeg',
			'small-photo.jpeg'
		);

		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toBeVisible();

		const imageId = await waitForUploadAndGetImageId( page );

		const media = await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ imageId }`,
		} );

		// The image should NOT be scaled since it's below the threshold.
		expect( media.source_url ).not.toContain( '-scaled' );

		// original_image should NOT be set for images below the threshold.
		expect( media.media_details.original_image ).toBeUndefined();

		// Original dimensions should be preserved exactly.
		expect( media.media_details.width ).toBe( 1024 );
		expect( media.media_details.height ).toBe( 768 );
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

	/**
	 * Uploads a file while preserving or renaming to a specific filename.
	 * Unlike upload() which renames to a UUID, this keeps the original name
	 * (or uses a custom rename), enabling tests that verify filename handling.
	 *
	 * @param {import('@playwright/test').Locator} inputElement The file input element.
	 * @param {string}                             customFile   Source file in assets directory.
	 * @param {string|null}                        rename       Optional filename to use instead of original.
	 * @return {Promise<string>} The filename used for upload.
	 */
	async uploadWithName( inputElement, customFile, rename = null ) {
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-image-' )
		);
		const targetName = rename || customFile;
		const tmpFileName = path.join( tmpDirectory, targetName );
		const filePath = path.join( this.basePath, customFile );
		await fs.copyFile( filePath, tmpFileName );

		await inputElement.setInputFiles( tmpFileName );

		return targetName;
	}
}
