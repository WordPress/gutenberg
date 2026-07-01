/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs/promises' );
const os = require( 'os' );
const { randomUUID } = require( 'crypto' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Probes a remote JPEG for an embedded UltraHDR gain map.
 *
 * Loaded lazily so the wasm-vips runtime (~10MB) only instantiates when an
 * UltraHDR test actually runs.
 *
 * @param {string} url Image URL to fetch.
 * @return {Promise<{ width: number, height: number, hasGainmap: boolean }>} Probe result.
 */
async function probeUltraHdrUrl( url ) {
	const { default: Vips } = await import( 'wasm-vips' );
	const vips = await Vips( {} );
	const response = await fetch( url );
	if ( ! response.ok ) {
		throw new Error( `Failed to fetch ${ url }: ${ response.status }` );
	}
	const bytes = new Uint8Array( await response.arrayBuffer() );
	const image = vips.Image.uhdrloadBuffer( bytes );
	return {
		width: image.width,
		height: image.pageHeight,
		hasGainmap: !! image.gainmap,
	};
}

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
		const uniqueName = randomUUID();
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
				const items = window.wp.data
					.select( 'core/upload-media' )
					.getItems();
				return items.length === 0;
			},
			{ timeout }
		);
	}

	/**
	 * Skip the test unless the client-side media processing pipeline is the
	 * active upload path. This mirrors the gate used in the editor's
	 * media-upload util: the global flag must be set AND the browser must
	 * meet the feature detection requirements (cross-origin isolation,
	 * SharedArrayBuffer, Web Workers, WebAssembly).
	 *
	 * @param {import('@playwright/test').TestInfo} testInstance The test object for skipping.
	 */
	async skipIfClientSideMediaInactive( testInstance ) {
		const isActive = await this.page.evaluate( () => {
			if ( ! window.__clientSideMediaProcessing ) {
				return false;
			}
			// Prefer the package's own detection when available so the
			// gate stays in sync with the editor's runtime decision.
			if (
				window.wp?.uploadMedia &&
				typeof window.wp.uploadMedia.isClientSideMediaSupported ===
					'function'
			) {
				return window.wp.uploadMedia.isClientSideMediaSupported();
			}
			// Fall back to the core preconditions for CSM. These are the
			// signals the package's feature detection inspects first.
			return (
				window.crossOriginIsolated === true &&
				typeof SharedArrayBuffer !== 'undefined' &&
				typeof WebAssembly !== 'undefined' &&
				typeof Worker !== 'undefined'
			);
		} );
		testInstance.skip(
			! isActive,
			'Client-side media processing is not active in this environment'
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

	/**
	 * Insert a core/image block, upload an asset, and return its REST media object.
	 *
	 * @param {Object} editor       The editor fixture.
	 * @param {Object} requestUtils The requestUtils fixture.
	 * @param {string} fileName     File name in the assets directory.
	 * @return {Promise<Object>} REST media object for the uploaded attachment.
	 */
	async uploadImageAndGetMedia( editor, requestUtils, fileName ) {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		await this.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' ),
			fileName
		);

		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toBeVisible();
		await expect( image ).toHaveAttribute( 'src', /^https?:\/\//, {
			timeout: 30_000,
		} );

		await this.waitForUploadQueueEmpty();

		const imageId = await this.getSelectedBlockImageId();
		expect( imageId ).toBeDefined();

		return await this.getMediaDetails( requestUtils, imageId );
	}
}

test.describe( 'Client-side media processing', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin, mediaProcessingUtils } ) => {
		await admin.createNewPost();
		// Every test in this describe exercises the CSM upload pipeline.
		// Skip up-front if it isn't the active path so we never assert on
		// server-side fallback behavior (covered by the image/gallery e2es).
		await mediaProcessingUtils.skipIfClientSideMediaInactive( test );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'preserves a JPEG below the size threshold', async ( {
		editor,
		mediaProcessingUtils,
		requestUtils,
	} ) => {
		const media = await mediaProcessingUtils.uploadImageAndGetMedia(
			editor,
			requestUtils,
			'1024x768_e2e_test_image_size.jpeg'
		);

		expect( media.mime_type ).toBe( 'image/jpeg' );
		expect( media.media_details.width ).toBe( 1024 );
		expect( media.media_details.height ).toBe( 768 );
		expect( media.source_url ).not.toContain( '-scaled' );
	} );

	test( 'preserves an opaque PNG without format conversion', async ( {
		editor,
		mediaProcessingUtils,
		requestUtils,
	} ) => {
		const media = await mediaProcessingUtils.uploadImageAndGetMedia(
			editor,
			requestUtils,
			'200x150_e2e_test_image_opaque.png'
		);

		expect( media.mime_type ).toBe( 'image/png' );
		expect( media.media_details.width ).toBe( 200 );
		expect( media.media_details.height ).toBe( 150 );
	} );

	test( 'preserves an animated GIF', async ( {
		editor,
		mediaProcessingUtils,
		requestUtils,
	} ) => {
		const media = await mediaProcessingUtils.uploadImageAndGetMedia(
			editor,
			requestUtils,
			'100x80_e2e_test_image_animated.gif'
		);

		expect( media.mime_type ).toBe( 'image/gif' );
		expect( media.media_details.width ).toBe( 100 );
		expect( media.media_details.height ).toBe( 80 );
	} );

	test( 'decodes and uploads a WebP image as WebP', async ( {
		editor,
		mediaProcessingUtils,
		requestUtils,
	} ) => {
		const media = await mediaProcessingUtils.uploadImageAndGetMedia(
			editor,
			requestUtils,
			'200x150_e2e_test_image_decode.webp'
		);

		expect( media.mime_type ).toBe( 'image/webp' );
		expect( media.media_details.width ).toBe( 200 );
		expect( media.media_details.height ).toBe( 150 );
	} );

	test( 'decodes and uploads an AVIF image as AVIF', async ( {
		editor,
		mediaProcessingUtils,
		requestUtils,
	} ) => {
		const media = await mediaProcessingUtils.uploadImageAndGetMedia(
			editor,
			requestUtils,
			'200x150_e2e_test_image_decode.avif'
		);

		expect( media.mime_type ).toBe( 'image/avif' );
		expect( media.media_details.width ).toBe( 200 );
		expect( media.media_details.height ).toBe( 150 );
	} );

	test( 'preserves UltraHDR gain map through sub-size resize', async ( {
		editor,
		mediaProcessingUtils,
		requestUtils,
	} ) => {
		const media = await mediaProcessingUtils.uploadImageAndGetMedia(
			editor,
			requestUtils,
			'1024x768_e2e_test_image_ultrahdr.jpeg'
		);

		expect( media.mime_type ).toBe( 'image/jpeg' );
		expect( media.media_details.width ).toBe( 1024 );
		expect( media.media_details.height ).toBe( 768 );

		// Default sub-sizes must be generated.
		const sizes = media.media_details.sizes;
		expect( sizes.thumbnail ).toBeDefined();
		expect( sizes.medium ).toBeDefined();

		// Every generated sub-size must still carry the embedded UltraHDR
		// gain map. This proves the resize step routed through libvips's
		// uhdrload/uhdrsave pipeline rather than the regular JPEG path
		// (which would have stripped the gain map).
		//
		// `thumbnail` is a hard-cropped square (exercising the manual
		// gain-map crop path) while `medium` is a proportional downscale
		// (exercising libvips's automatic gain-map resize), so checking both
		// covers both code paths end to end.
		for ( const sizeName of [ 'thumbnail', 'medium' ] ) {
			const size = sizes[ sizeName ];
			const probed = await probeUltraHdrUrl( size.source_url );
			expect( probed.hasGainmap ).toBe( true );
			// The decoded base image must match the registered sub-size
			// dimensions, confirming the gain map travels with a correctly
			// resized/cropped image rather than a stale full-size one.
			expect( probed.width ).toBe( size.width );
			expect( probed.height ).toBe( size.height );
		}
	} );

	test( 'scales oversized images and generates the standard sub-sizes', async ( {
		editor,
		mediaProcessingUtils,
		requestUtils,
	} ) => {
		const media = await mediaProcessingUtils.uploadImageAndGetMedia(
			editor,
			requestUtils,
			'5000x4000_e2e_test_image_oversized.jpeg'
		);

		// 5000x4000 must be scaled to fit within the 2560 default threshold.
		// CSM scales the longest edge to 2560 and writes a -scaled file.
		expect( media.source_url ).toContain( '-scaled' );
		expect( media.media_details.width ).toBe( 2560 );
		expect( media.media_details.height ).toBe( 2048 );

		// The unscaled original is preserved alongside the scaled main file.
		expect( media.media_details.original_image ).toBeDefined();

		// CSM must produce the WordPress default sub-sizes.
		const sizes = media.media_details.sizes;
		expect( sizes.thumbnail ).toBeDefined();
		expect( sizes.medium ).toBeDefined();
		expect( sizes.large ).toBeDefined();

		// Default thumbnail is 150x150 (cropped).
		expect( sizes.thumbnail.width ).toBe( 150 );
		expect( sizes.thumbnail.height ).toBe( 150 );

		// Default medium fits within 300x300 (preserves aspect ratio).
		expect( sizes.medium.width ).toBeLessThanOrEqual( 300 );
		expect( sizes.medium.height ).toBeLessThanOrEqual( 300 );

		// Default large fits within 1024x1024 (preserves aspect ratio).
		expect( sizes.large.width ).toBeLessThanOrEqual( 1024 );
		expect( sizes.large.height ).toBeLessThanOrEqual( 1024 );
	} );

	test( 'uploads multiple images via gallery', async ( {
		page,
		editor,
		mediaProcessingUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/gallery' } );

		const galleryBlock = editor.canvas.locator(
			'role=document[name="Block: Gallery"i]'
		);
		await expect( galleryBlock ).toBeVisible();

		const uploadInput = galleryBlock.locator(
			'data-testid=form-file-upload-input'
		);

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
			const uniqueName = randomUUID();
			const ext = path.extname( file );
			const tmpFile = path.join( tmpDirectory, uniqueName + ext );
			await fs.copyFile( path.join( ASSETS_DIR, file ), tmpFile );
			tmpFiles.push( tmpFile );
		}

		await uploadInput.setInputFiles( tmpFiles );

		await mediaProcessingUtils.waitForUploadQueueEmpty();

		const images = galleryBlock.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( images ).toHaveCount( files.length, { timeout: 60_000 } );

		// CSM holds the post-save lock until every queued upload finishes.
		// The Publish button should be enabled after the queue drains.
		const publishButton = page.locator(
			'role=region[name="Editor top bar"i] >> role=button[name="Publish"i]'
		);
		await expect( publishButton ).toBeEnabled( { timeout: 60_000 } );
	} );

	test( 'rejects an unsupported file type', async ( { page, editor } ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-invalid-' )
		);
		const tmpFile = path.join( tmpDirectory, 'test.txt' );
		await fs.writeFile( tmpFile, 'This is not an image.' );

		await imageBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( tmpFile );

		const snackbar = page.locator( '.components-snackbar-list' );
		await expect( snackbar ).toBeVisible( { timeout: 10_000 } );
	} );

	test( 'converts an opaque PNG to JPEG when image_editor_output_format is filtered', async ( {
		page,
		editor,
		mediaProcessingUtils,
		requestUtils,
	} ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-image-format-conversion-png-to-jpeg'
		);

		try {
			await page.reload();
			// Re-check after the reload — the plugin doesn't change CSM
			// availability, but the page state is fresh.
			await mediaProcessingUtils.skipIfClientSideMediaInactive( test );

			const media = await mediaProcessingUtils.uploadImageAndGetMedia(
				editor,
				requestUtils,
				'200x150_e2e_test_image_opaque.png'
			);

			// With the filter active and no transparency, CSM transcodes
			// sub-sizes to JPEG and the server transcodes the main file.
			expect( media.mime_type ).toBe( 'image/jpeg' );
		} finally {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-plugin-image-format-conversion-png-to-jpeg'
			);
		}
	} );

	test( 'preserves a transparent PNG even when PNG-to-JPEG is filtered', async ( {
		page,
		editor,
		mediaProcessingUtils,
		requestUtils,
	} ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-image-format-conversion-png-to-jpeg'
		);

		try {
			await page.reload();
			await mediaProcessingUtils.skipIfClientSideMediaInactive( test );

			const media = await mediaProcessingUtils.uploadImageAndGetMedia(
				editor,
				requestUtils,
				'200x150_e2e_test_image_transparent.png'
			);

			// CSM detects the alpha channel and skips the JPEG transcode to
			// preserve transparency.
			expect( media.mime_type ).toBe( 'image/png' );
		} finally {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-plugin-image-format-conversion-png-to-jpeg'
			);
		}
	} );

	test( 'converts a JPEG to WebP when image_editor_output_format is filtered', async ( {
		page,
		editor,
		mediaProcessingUtils,
		requestUtils,
	} ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-image-format-conversion-jpeg-to-webp'
		);

		try {
			await page.reload();
			await mediaProcessingUtils.skipIfClientSideMediaInactive( test );

			const media = await mediaProcessingUtils.uploadImageAndGetMedia(
				editor,
				requestUtils,
				'1024x768_e2e_test_image_size.jpeg'
			);

			expect( media.mime_type ).toBe( 'image/webp' );
		} finally {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-plugin-image-format-conversion-jpeg-to-webp'
			);
		}
	} );

	test( 'renders srcset on the front end after publishing a CSM-uploaded image', async ( {
		page,
		editor,
		mediaProcessingUtils,
		requestUtils,
	} ) => {
		// Regression for the CSM srcset bug: when CSM uploads the unscaled
		// original (then sideloads sub-sizes and a -scaled file), the block
		// must end up storing a URL that matches a known size in the
		// attachment metadata. Otherwise wp_calculate_image_srcset() returns
		// false and the front-end `<img>` ships with no srcset.
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		await mediaProcessingUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' ),
			'5000x4000_e2e_test_image_oversized.jpeg'
		);

		const imageInEditor = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( imageInEditor ).toBeVisible();
		await expect( imageInEditor ).toHaveAttribute( 'src', /^https?:\/\//, {
			timeout: 30_000,
		} );

		// Wait for the full upload pipeline (including finalize) to settle.
		await mediaProcessingUtils.waitForUploadQueueEmpty();
		await expect( imageBlock ).not.toHaveClass( /is-transient/, {
			timeout: 30_000,
		} );
		await expect(
			page.getByRole( 'button', { name: 'Publish', exact: true } )
		).toBeEnabled( { timeout: 30_000 } );

		// Confirm the stored block URL was updated to the scaled file after
		// finalize. Without the fix, the block would keep the unscaled
		// original's URL and the assertion would fail.
		const blockUrl = await page.evaluate( () => {
			return window.wp.data
				.select( 'core/block-editor' )
				.getSelectedBlock()?.attributes?.url;
		} );
		expect( blockUrl ).toMatch( /-scaled\.jpe?g$/ );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const figureDom = page.getByRole( 'figure' );
		await expect( figureDom ).toBeVisible();

		const imageDom = figureDom.locator( 'img' );
		await expect( imageDom ).toBeVisible();

		// The fix: srcset must be present and reference the sub-sizes that
		// CSM sideloaded. Without it, wp_calculate_image_srcset() returns
		// false because the src basename doesn't match anything in
		// $image_meta['sizes']. Require at least two width descriptors —
		// core itself returns false (no attribute) when fewer than two
		// candidates qualify.
		await expect( imageDom ).toHaveAttribute( 'srcset', /\d+w.*\d+w/s );

		const imageId = await mediaProcessingUtils.getSelectedBlockImageId();
		expect( imageId ).toBeDefined();
		const media = await mediaProcessingUtils.getMediaDetails(
			requestUtils,
			imageId
		);
		// Sanity: the metadata used by core to build srcset is populated.
		expect( media.media_details.sizes.medium ).toBeDefined();
		expect( media.media_details.sizes.large ).toBeDefined();
	} );

	test( 'auto-rotates images based on EXIF orientation', async ( {
		editor,
		mediaProcessingUtils,
		requestUtils,
	} ) => {
		// EXIF orientation=6 means a 90° clockwise rotation. The asset is
		// stored 1024x768 in pixels but should land 768x1024 after CSM
		// applies the EXIF-driven rotation.
		const media = await mediaProcessingUtils.uploadImageAndGetMedia(
			editor,
			requestUtils,
			'1024x768_e2e_test_image_rotated.jpeg'
		);

		expect( media.media_details.width ).toBe( 768 );
		expect( media.media_details.height ).toBe( 1024 );
	} );

	test( 'recovers from a transient upload failure via automatic retry', async ( {
		page,
		editor,
		mediaProcessingUtils,
		requestUtils,
	} ) => {
		// Abort only the first attempt to create the attachment, then let
		// the automatic retry through. A network-level abort surfaces from
		// apiFetch as the retryable "Could not get a valid response" error.
		let createAttempts = 0;
		await page.route( '**/wp/v2/media**', async ( route ) => {
			const request = route.request();
			const isCreate =
				request.method() === 'POST' &&
				/\/wp\/v2\/media(\?|$)/.test( request.url() );
			if ( isCreate ) {
				createAttempts += 1;
				if ( createAttempts === 1 ) {
					await route.abort( 'failed' );
					return;
				}
			}
			await route.continue();
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

		// Despite the first attempt failing, the automatic retry should
		// recover the upload and resolve the block to a server URL. The
		// generous timeout covers the retry backoff plus re-processing.
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toHaveAttribute( 'src', /^https?:\/\//, {
			timeout: 60_000,
		} );

		await mediaProcessingUtils.waitForUploadQueueEmpty();

		const imageId = await mediaProcessingUtils.getSelectedBlockImageId();
		expect( imageId ).toBeDefined();
		const media = await mediaProcessingUtils.getMediaDetails(
			requestUtils,
			imageId
		);
		expect( media.mime_type ).toBe( 'image/jpeg' );

		// The first attempt failed, so the upload only succeeded because a
		// retry ran — there must be at least two create attempts.
		expect( createAttempts ).toBeGreaterThanOrEqual( 2 );

		await page.unroute( '**/wp/v2/media**' );
	} );

	test( 'surfaces an error after exhausting upload retries', async ( {
		page,
		editor,
		mediaProcessingUtils,
	} ) => {
		// Read the configured retry budget from the store so the attempt
		// count assertion tracks the default instead of hardcoding it.
		const maxRetryAttempts = await page.evaluate(
			() =>
				window.wp.data.select( 'core/upload-media' ).getSettings().retry
					.maxRetryAttempts
		);

		// Abort every attempt to create the attachment so the retry budget
		// is fully spent.
		let createAttempts = 0;
		await page.route( '**/wp/v2/media**', async ( route ) => {
			const request = route.request();
			const isCreate =
				request.method() === 'POST' &&
				/\/wp\/v2\/media(\?|$)/.test( request.url() );
			if ( isCreate ) {
				createAttempts += 1;
				await route.abort( 'failed' );
				return;
			}
			await route.continue();
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

		// Once the initial attempt plus the full retry budget are spent, the
		// failure surfaces as an error snackbar carrying the underlying
		// fetch error message. The timeout covers the exponential backoff
		// between attempts (~1s + ~2s + ~4s with the defaults).
		const errorSnackbar = page
			.locator( '.components-snackbar' )
			.filter( { hasText: /could not get a valid response/i } );
		await expect( errorSnackbar ).toBeVisible( { timeout: 60_000 } );

		// Initial attempt plus the configured number of retries.
		expect( createAttempts ).toBe( maxRetryAttempts + 1 );

		await page.unroute( '**/wp/v2/media**' );
	} );
} );
