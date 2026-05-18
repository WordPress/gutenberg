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

/** Animated GIF fixture used for conversion tests. */
const ANIMATED_GIF_FIXTURE = '100x80_e2e_test_image_animated.gif';

test.use( {
	gifToVideoUtils: async ( { page }, use ) => {
		await use( new GifToVideoUtils( { page } ) );
	},
} );

/**
 * Shared utilities for the GIF-to-video e2e tests.
 */
class GifToVideoUtils {
	constructor( { page } ) {
		/** @type {Page} */
		this.page = page;
	}

	/**
	 * Upload a file to the given input element.
	 * Copies the asset to a unique temp file to avoid cross-test collisions.
	 *
	 * @param {import('@playwright/test').Locator} inputElement File input locator.
	 * @param {string}                             fileName     File name in the assets directory.
	 * @return {Promise<string>} Unique file name (without extension).
	 */
	async upload( inputElement, fileName ) {
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-gif-' )
		);
		const uniqueName = uuid();
		const extension = path.extname( fileName );
		const tmpFileName = path.join( tmpDirectory, uniqueName + extension );
		await fs.copyFile( path.join( ASSETS_DIR, fileName ), tmpFileName );
		await inputElement.setInputFiles( tmpFileName );
		return uniqueName;
	}

	/**
	 * Wait for the upload-media store queue to drain.
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
	 * Skip this test if the mediabunny GIF-to-video path is not active.
	 *
	 * The conversion requires:
	 *   - client-side media processing enabled globally,
	 *   - ImageDecoder (for GIF frame extraction), and
	 *   - VideoEncoder (WebCodecs encode).
	 *
	 * @param {import('@playwright/test').TestInfo} testInstance The test object.
	 */
	async skipIfGifConversionInactive( testInstance ) {
		const isActive = await this.page.evaluate( () => {
			if ( ! window.__clientSideMediaProcessing ) {
				return false;
			}
			return (
				typeof ImageDecoder !== 'undefined' &&
				typeof VideoEncoder !== 'undefined' &&
				window.crossOriginIsolated === true
			);
		} );
		testInstance.skip(
			! isActive,
			'mediabunny GIF-to-video is not active in this environment (requires WebCodecs + cross-origin isolation)'
		);
	}
}

test.describe( 'Mediabunny: animated GIF to video conversion', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin, gifToVideoUtils } ) => {
		await admin.createNewPost();
		await gifToVideoUtils.skipIfGifConversionInactive( test );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'converts an animated GIF to a video on upload', async ( {
		editor,
		gifToVideoUtils,
		requestUtils,
	} ) => {
		// Insert an image block; the upload pipeline will intercept the GIF
		// and replace it with a video via mediabunny + WebCodecs.
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		await gifToVideoUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' ),
			ANIMATED_GIF_FIXTURE
		);

		// After conversion the block should display the transcoded video.
		// The blob URL is set on the attachment during transcoding; wait for
		// the final server-side URL (http/https) to confirm a successful upload.
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toBeVisible( { timeout: 30_000 } );
		await expect( image ).toHaveAttribute( 'src', /^https?:\/\//, {
			timeout: 30_000,
		} );

		// Drain the queue before inspecting the REST API response.
		await gifToVideoUtils.waitForUploadQueueEmpty( 30_000 );

		// Retrieve the attachment ID from the block and confirm via REST API
		// that the uploaded file is a video (MP4 or WebM).
		const attachmentId = await gifToVideoUtils.page.evaluate(
			() =>
				window.wp.data.select( 'core/block-editor' ).getSelectedBlock()
					?.attributes?.id
		);
		expect( attachmentId ).toBeDefined();

		const media = await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ attachmentId }`,
		} );

		// The critical assertion: the GIF was transcoded to a video format.
		expect( [ 'video/mp4', 'video/webm' ] ).toContain( media.mime_type );
	} );
} );
