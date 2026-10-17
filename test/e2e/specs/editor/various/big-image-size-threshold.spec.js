const path = require( 'path' );
const fs = require( 'fs/promises' );
const os = require( 'os' );
const { randomUUID } = require( 'crypto' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * @typedef {import('@playwright/test').Page} Page
 */

/**
 * Returns the file name of an upload-relative path such as `2026/08/image.jpeg`.
 *
 * @param {string} file Upload-relative file path.
 * @return {string} File name.
 */
function wpBasename( file ) {
	return file.split( '/' ).pop();
}

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
		const fileName = await imageBlockUtils.upload(
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
			undefined,
			{ timeout: 120000 }
		);

		// Get the image ID from the block.
		const imageId = await page.evaluate(
			() =>
				window.wp.data.select( 'core/block-editor' ).getSelectedBlock()
					?.attributes?.id
		);

		expect( imageId ).toBeDefined();

		// Fetch the attachment details from the REST API.
		const media = await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ imageId }`,
		} );

		// The image should be scaled down to the threshold.
		expect( media.media_details.width ).toBeLessThanOrEqual( 2560 );
		expect( media.media_details.height ).toBeLessThanOrEqual( 2560 );

		/*
		 * Only the scaled-down copy carries the `-scaled` suffix, and the
		 * untouched upload is kept alongside it as `original_image`. If the
		 * server also scales the upload while the client owns the derivatives,
		 * the client's scaled file collides with the server's and is stored as
		 * `-scaled-1`, the sub-sizes inherit the numbered name, and the
		 * server's full-size file is orphaned on disk.
		 * See https://core.trac.wordpress.org/ticket/65708.
		 */
		expect( wpBasename( media.media_details.file ) ).toBe(
			`${ fileName }-scaled.jpeg`
		);
		expect( media.media_details.original_image ).toBe(
			`${ fileName }.jpeg`
		);

		// Sub-sizes are named after the original, with no collision suffix.
		// The `full` entry is the attached file itself, so it is skipped.
		const sizes = Object.entries( media.media_details.sizes ).filter(
			( [ name ] ) => name !== 'full'
		);
		expect( sizes.length ).toBeGreaterThan( 0 );

		for ( const [ name, size ] of sizes ) {
			expect(
				size.file,
				`the "${ name }" sub-size should be named after the original`
			).toBe( `${ fileName }-${ size.width }x${ size.height }.jpeg` );
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
			undefined,
			{ timeout: 120000 }
		);

		// Get the image ID from the block.
		const imageId = await page.evaluate(
			() =>
				window.wp.data.select( 'core/block-editor' ).getSelectedBlock()
					?.attributes?.id
		);

		expect( imageId ).toBeDefined();

		// Fetch the attachment details from the REST API.
		const media = await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ imageId }`,
		} );

		// The image should NOT be scaled since it's below the threshold.
		expect( media.source_url ).not.toContain( '-scaled' );
		expect( media.media_details.original_image ).toBeUndefined();
		// Original dimensions should be preserved.
		expect( media.media_details.width ).toBe( 1024 );
		expect( media.media_details.height ).toBe( 768 );
	} );
} );

class ImageBlockUtils {
	constructor( { page } ) {
		/** @type {Page} */
		this.page = page;
		this.basePath = './assets';

		this.TEST_IMAGE_FILE_PATH = `${ this.basePath }/10x10_e2e_test_image_z9T8jK.png`;
	}

	async upload( inputElement, customFile = null ) {
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-image-' )
		);
		const fileName = randomUUID();
		const extension = customFile ? path.extname( customFile ) : '.png';
		const tmpFileName = path.join( tmpDirectory, fileName + extension );
		const filePath = customFile
			? `${ this.basePath }/${ customFile }`
			: this.TEST_IMAGE_FILE_PATH;
		await fs.copyFile( filePath, tmpFileName );

		await inputElement.setInputFiles( tmpFileName );

		return fileName;
	}
}
