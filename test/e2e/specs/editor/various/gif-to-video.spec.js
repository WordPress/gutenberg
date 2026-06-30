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
		const uniqueName = randomUUID();
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
	 * Skip this test if the GIF-to-video path is not active.
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
			'GIF-to-video conversion is not active in this environment (requires WebCodecs + cross-origin isolation)'
		);
	}
}

test.describe( 'Video conversion: animated GIF to video', () => {
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

	test( 'switches an uploaded GIF to the video GIF variation', async ( {
		editor,
		gifToVideoUtils,
		requestUtils,
	} ) => {
		// The GIF uploads as a normal image attachment and the transcoded
		// video is sideloaded as that attachment's `animated_video` meta.
		// Once the companion is available, the editor switches the Image
		// block to the Video block's "GIF" variation playing that video,
		// so it renders as a native <video> with no render-time PHP.
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();

		await gifToVideoUtils.upload(
			imageBlock.locator( 'data-testid=form-file-upload-input' ),
			ANIMATED_GIF_FIXTURE
		);

		// Drain the full queue (parent GIF upload + companion video
		// sideload + TranscodeGif). On success the attachment record is
		// invalidated, the block refetches it and the converter runs.
		await gifToVideoUtils.waitForUploadQueueEmpty( 60_000 );

		// The block becomes a core/video block.
		await gifToVideoUtils.page.waitForFunction(
			() =>
				window.wp.data
					.select( 'core/block-editor' )
					.getBlocks()
					.some( ( block ) => block.name === 'core/video' ),
			{ timeout: 30_000 }
		);

		const videoBlock = await gifToVideoUtils.page.evaluate( () =>
			window.wp.data
				.select( 'core/block-editor' )
				.getBlocks()
				.find( ( block ) => block.name === 'core/video' )
		);

		// It is the GIF variation: a muted, looping, autoplaying, inline
		// video with no controls, sourced from the converted companion.
		expect( videoBlock.attributes.controls ).toBe( false );
		expect( videoBlock.attributes.loop ).toBe( true );
		expect( videoBlock.attributes.autoplay ).toBe( true );
		expect( videoBlock.attributes.muted ).toBe( true );
		expect( videoBlock.attributes.playsInline ).toBe( true );
		expect( videoBlock.attributes.src ).toMatch( /\.(mp4|webm)(\?.*)?$/i );

		// The converted block carries the GIF's intrinsic dimensions so the
		// <video> has a stable aspect ratio from the first paint.
		expect( videoBlock.attributes.width ).toBeGreaterThan( 0 );
		expect( videoBlock.attributes.height ).toBeGreaterThan( 0 );

		// Those dimensions must reach the rendered <video> as the width/height
		// attributes that give it a stable intrinsic size.
		const renderedVideo = editor.canvas.locator(
			'figure.wp-block-video video'
		);
		await expect( renderedVideo ).toHaveAttribute(
			'width',
			String( videoBlock.attributes.width )
		);
		await expect( renderedVideo ).toHaveAttribute(
			'height',
			String( videoBlock.attributes.height )
		);

		// The <video> also needs an explicit (non-`auto`) aspect-ratio derived
		// from those dimensions. The width/height attributes alone only yield
		// `aspect-ratio: auto W/H`, whose `auto` keyword defers to the element's
		// natural ratio while the poster/metadata load - during which the box
		// height briefly blows up to tens of thousands of pixels before
		// settling, reading as a duplicated image during the swap. An explicit
		// ratio governs the height throughout the load and prevents that spike.
		await expect( renderedVideo ).toHaveCSS(
			'aspect-ratio',
			`${ videoBlock.attributes.width } / ${ videoBlock.attributes.height }`
		);

		// The underlying media is still the GIF image with a recorded
		// companion video (basename only) in its metadata.
		const attachmentId = videoBlock.attributes.id;
		expect( attachmentId ).toBeDefined();

		const media = await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ attachmentId }`,
		} );

		expect( media.mime_type ).toBe( 'image/gif' );
		expect( media.media_details ).toBeDefined();
		expect( typeof media.media_details.animated_video ).toBe( 'string' );
		expect( media.media_details.animated_video ).toMatch(
			/\.(mp4|webm)$/i
		);

		// The block's dimensions come straight from the source GIF.
		expect( videoBlock.attributes.width ).toBe( media.media_details.width );
		expect( videoBlock.attributes.height ).toBe(
			media.media_details.height
		);
	} );
} );
