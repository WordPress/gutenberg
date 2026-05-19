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

/**
 * Animated GIF fixture used for conversion tests.
 *
 * Deliberately uses odd width AND height (599x441): the avc/vp9 encoders
 * reject odd dimensions, so this fixture regression-guards the even-dimension
 * padding. Its size also makes the ImageDecoder track-ready race
 * (`completed` resolving before `tracks.ready`) reproducible, which an
 * even, tiny fixture did not catch.
 */
const ANIMATED_GIF_FIXTURE = '599x441_e2e_test_image_animated.gif';

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
		// This guard is intentionally conservative: it skips the test when any
		// required capability is absent. The crossOriginIsolated check is not a
		// runtime capability differentiator - client-side media already requires
		// Document Isolation Policy globally - but it confirms the test
		// environment is set up correctly before asserting conversion results.
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

	test( 'keeps the GIF as core/image and sideloads a companion video', async ( {
		editor,
		gifToVideoUtils,
		requestUtils,
	} ) => {
		// The companion-file design uploads the GIF as a normal image
		// attachment (block stays a valid core/image) and sideloads the
		// transcoded video as that attachment's `animated_video` meta.
		// The render-time PHP filter swaps the GIF <img> for a
		// GIF-behaving <video> on the front end.
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		await gifToVideoUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' ),
			ANIMATED_GIF_FIXTURE
		);

		// Editor still shows the GIF in an <img>: the block was not
		// transformed, and the <img>'s final src is the server URL.
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toBeVisible( { timeout: 30_000 } );
		await expect( image ).toHaveAttribute(
			'src',
			/^https?:\/\/.*\.gif(\?.*)?$/i,
			{ timeout: 30_000 }
		);

		// Drain the full queue (parent GIF upload + companion video
		// sideload + TranscodeGif) before inspecting REST.
		await gifToVideoUtils.waitForUploadQueueEmpty( 60_000 );

		// Block must remain core/image.
		const selectedBlockName = await gifToVideoUtils.page.evaluate(
			() =>
				window.wp.data.select( 'core/block-editor' ).getSelectedBlock()
					?.name
		);
		expect( selectedBlockName ).toBe( 'core/image' );

		// Attachment must be an image (GIF), not a video.
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

		expect( media.mime_type ).toBe( 'image/gif' );

		// Companion video filename should be recorded in attachment
		// metadata under the animated_video key (basename only).
		expect( media.media_details ).toBeDefined();
		expect( typeof media.media_details.animated_video ).toBe( 'string' );
		expect( media.media_details.animated_video ).toMatch(
			/\.(mp4|webm)$/i
		);
	} );
} );
