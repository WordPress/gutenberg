/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * @typedef {import('@playwright/test').Page} Page
 */

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
	 * Generates a short, non-web-safe WebM clip in the browser via
	 * MediaRecorder. A WebM with the default MP4 output target triggers
	 * transcoding (container mismatch), without needing a committed binary
	 * fixture or a server-side encoder.
	 *
	 * @return {Promise<Buffer>} The encoded WebM bytes.
	 */
	async createWebmBuffer() {
		const bytes = await this.page.evaluate( async () => {
			const canvas = document.createElement( 'canvas' );
			canvas.width = 320;
			canvas.height = 240;
			const ctx = canvas.getContext( '2d' );
			const stream = canvas.captureStream( 30 );
			const recorder = new MediaRecorder( stream, {
				mimeType: 'video/webm',
			} );
			const chunks = [];
			recorder.ondataavailable = ( event ) => {
				if ( event.data.size > 0 ) {
					chunks.push( event.data );
				}
			};
			const stopped = new Promise( ( resolve ) => {
				recorder.onstop = resolve;
			} );
			recorder.start();
			// Draw ~20 alternating frames (~0.6s) so the clip has real,
			// decodable content for the transcoder.
			for ( let i = 0; i < 20; i++ ) {
				ctx.fillStyle = i % 2 ? '#ff0000' : '#0000ff';
				ctx.fillRect( 0, 0, canvas.width, canvas.height );

				await new Promise( ( resolve ) => setTimeout( resolve, 30 ) );
			}
			recorder.stop();
			await stopped;
			const blob = new Blob( chunks, { type: 'video/webm' } );
			const buffer = await blob.arrayBuffer();
			return Array.from( new Uint8Array( buffer ) );
		} );
		return Buffer.from( bytes );
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
				typeof window.MediaRecorder !== 'undefined' &&
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

		// Upload a browser-generated WebM clip. The original uploads as the
		// attachment; a transcoded MP4 companion is sideloaded and recorded in
		// the attachment metadata, and the block plays that companion.
		const buffer = await videoTranscodingUtils.createWebmBuffer();
		await videoBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( {
				name: 'transcode-test.webm',
				mimeType: 'video/webm',
				buffer,
			} );

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

		const buffer = await videoTranscodingUtils.createWebmBuffer();
		await videoBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( {
				name: 'transcode-toggle.webm',
				mimeType: 'video/webm',
				buffer,
			} );

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
