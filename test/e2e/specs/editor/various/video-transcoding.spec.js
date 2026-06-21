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
 * Small non-web-safe video fixture used for transcoding tests.
 *
 * A WebM clip: with the default MP4 output target it triggers a real
 * transcode (container mismatch, VP8/VP9 → H.264) without needing a
 * server-side encoder.
 */
const VIDEO_FIXTURE = '160x120-transcode-test.webm';

test.use( {
	videoTranscodingUtils: async ( { page }, use ) => {
		await use( new VideoTranscodingUtils( { page } ) );
	},
} );

/**
 * Shared utilities for the video transcoding e2e tests.
 */
class VideoTranscodingUtils {
	constructor( { page } ) {
		/** @type {Page} */
		this.page = page;
	}

	/**
	 * Upload a fixture to the given input element. Copies the asset to a
	 * unique temp file to avoid cross-test collisions.
	 *
	 * @param {import('@playwright/test').Locator} inputElement File input locator.
	 * @param {string}                             fileName     File name in the assets directory.
	 * @return {Promise<string>} Unique file name (without extension).
	 */
	async upload( inputElement, fileName ) {
		const tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-video-' )
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
	 * Skip this test if client-side video transcoding is not active.
	 *
	 * @param {import('@playwright/test').TestInfo} testInstance The test object.
	 */
	async skipIfTranscodingInactive( testInstance ) {
		const isActive = await this.page.evaluate( () => {
			if ( ! window.__clientSideMediaProcessing ) {
				return false;
			}
			return (
				typeof VideoEncoder !== 'undefined' &&
				window.crossOriginIsolated === true
			);
		} );
		testInstance.skip(
			! isActive,
			'Client-side video transcoding is not active in this environment (requires WebCodecs + cross-origin isolation)'
		);
	}
}

test.describe( 'Video transcoding: web-safe conversion', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin, videoTranscodingUtils } ) => {
		await admin.createNewPost();
		await videoTranscodingUtils.skipIfTranscodingInactive( test );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'transcodes a non-web-safe upload and plays the companion', async ( {
		editor,
		page,
		videoTranscodingUtils,
		requestUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/video' } );

		const videoBlock = editor.canvas.locator(
			'role=document[name="Block: Video"i]'
		);
		await expect( videoBlock ).toBeVisible();

		// Upload the WebM fixture. The original uploads as the attachment; a
		// transcoded MP4 companion is sideloaded and recorded in the
		// attachment metadata, and the block plays that companion.
		await videoTranscodingUtils.upload(
			videoBlock.locator( 'data-testid=form-file-upload-input' ),
			VIDEO_FIXTURE
		);

		// Drain the full queue (original upload + companion transcode +
		// sideload + finalize).
		await videoTranscodingUtils.waitForUploadQueueEmpty( 120_000 );

		const block = await page.evaluate( () =>
			window.wp.data
				.select( 'core/block-editor' )
				.getBlocks()
				.find( ( b ) => b.name === 'core/video' )
		);

		// The block plays the web-safe MP4 companion, not a blob URL.
		expect( block.attributes.id ).toBeDefined();
		expect( block.attributes.src ).toMatch( /\.mp4(\?.*)?$/i );
		expect( block.attributes.src ).not.toMatch( /^blob:/ );

		// The original upload is preserved as the attachment (still WebM),
		// with the transcoded companion recorded in its metadata.
		const media = await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ block.attributes.id }`,
		} );

		expect( media.mime_type ).toBe( 'video/webm' );
		expect( typeof media.media_details.optimized_video ).toBe( 'string' );
		expect( media.media_details.optimized_video ).toMatch( /\.mp4$/i );
	} );

	test( 'toggles between the optimized companion and the original', async ( {
		editor,
		page,
		videoTranscodingUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/video' } );

		const videoBlock = editor.canvas.locator(
			'role=document[name="Block: Video"i]'
		);
		await expect( videoBlock ).toBeVisible();

		await videoTranscodingUtils.upload(
			videoBlock.locator( 'data-testid=form-file-upload-input' ),
			VIDEO_FIXTURE
		);

		await videoTranscodingUtils.waitForUploadQueueEmpty( 120_000 );

		const optimizedSrc = await page.evaluate(
			() =>
				window.wp.data
					.select( 'core/block-editor' )
					.getBlocks()
					.find( ( b ) => b.name === 'core/video' ).attributes.src
		);
		expect( optimizedSrc ).toMatch( /\.mp4(\?.*)?$/i );

		// Switch to the original upload via the toolbar control.
		await editor.canvas
			.locator( 'role=document[name="Block: Video"i]' )
			.click();
		await page
			.getByRole( 'button', { name: 'Use original video' } )
			.click();

		const originalSrc = await page.evaluate(
			() =>
				window.wp.data
					.select( 'core/block-editor' )
					.getBlocks()
					.find( ( b ) => b.name === 'core/video' ).attributes.src
		);
		expect( originalSrc ).toMatch( /\.webm(\?.*)?$/i );
	} );
} );
