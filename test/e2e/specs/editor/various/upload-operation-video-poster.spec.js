/**
 * A step after `core/upload`, exercised from outside the package: a test
 * plugin registers an operation that runs once a video has been uploaded,
 * reads the attachment the upload step produced, grabs the first frame in
 * the browser and posts it to the plugin's own endpoint. The assertions are
 * what the server received.
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	skipIfClientSideMediaInactive,
} = require( './client-side-media-utils' );

const PLUGIN = 'gutenberg-test-plugin-upload-operation-video-poster';

/**
 * Records a short video in the browser, so the test needs no video fixture.
 *
 * A canvas painted one color is captured as a stream and recorded to WebM.
 * The recording is what a camera app would hand the upload: a real video
 * the browser can decode, with a first frame of a known color.
 *
 * @param {import('@playwright/test').Page} page Playwright page.
 * @return {Promise<Buffer>} The WebM file.
 */
async function recordVideo( page ) {
	const base64 = await page.evaluate( async () => {
		const canvas = document.createElement( 'canvas' );
		canvas.width = 320;
		canvas.height = 240;
		const context = canvas.getContext( '2d' );
		const stream = canvas.captureStream( 30 );
		const recorder = new MediaRecorder( stream, {
			mimeType: 'video/webm',
		} );
		const chunks = [];
		recorder.ondataavailable = ( event ) => chunks.push( event.data );
		const stopped = new Promise( ( resolve ) => {
			recorder.onstop = resolve;
		} );

		recorder.start();
		// Repaint while recording so the stream has frames to capture.
		const painting = setInterval( () => {
			context.fillStyle = '#ff0000';
			context.fillRect( 0, 0, canvas.width, canvas.height );
		}, 40 );
		await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );
		clearInterval( painting );
		recorder.stop();
		await stopped;

		const blob = new Blob( chunks, { type: 'video/webm' } );
		const bytes = new Uint8Array( await blob.arrayBuffer() );
		let binary = '';
		for ( const byte of bytes ) {
			binary += String.fromCharCode( byte );
		}
		return window.btoa( binary );
	} );
	return Buffer.from( base64, 'base64' );
}

test.describe( 'Upload operations: video poster plugin', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( PLUGIN );
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin, page } ) => {
		await admin.createNewPost();
		await skipIfClientSideMediaInactive( page, test );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( PLUGIN );
	} );

	test( 'registers its step and its pool through the public API', async ( {
		page,
	} ) => {
		const operation = await page.evaluate( () => {
			const registered = window.wp.uploadMedia.getUploadOperation(
				'gutenberg-test/video-poster'
			);
			return (
				registered && {
					label: registered.label,
					concurrency: registered.concurrency,
				}
			);
		} );

		expect( operation ).toEqual( {
			label: 'Grabbing a poster frame',
			concurrency: 'gutenberg-test/video-poster',
		} );
	} );

	test( 'posts the first frame once the video has been uploaded', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Add default block' } )
		).toBeVisible();

		const buffer = await recordVideo( page );

		await editor.insertBlock( { name: 'core/video' } );
		const videoBlock = editor.canvas.locator(
			'role=document[name="Block: Video"i]'
		);
		await expect( videoBlock ).toBeVisible();

		await videoBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( {
				name: 'recording.webm',
				mimeType: 'video/webm',
				buffer,
			} );

		// Drain the queue: the upload, then the plugin's step.
		await page.waitForFunction(
			() =>
				window.wp.data.select( 'core/upload-media' ).getItems()
					.length === 0,
			undefined,
			{ timeout: 60_000 }
		);

		const attachmentId = await page.evaluate(
			() =>
				window.wp.data
					.select( 'core/block-editor' )
					.getBlocks()
					.find( ( block ) => block.name === 'core/video' )
					?.attributes.id
		);
		expect( attachmentId ).toBeDefined();

		const media = await requestUtils.rest( {
			method: 'GET',
			path: `/wp/v2/media/${ attachmentId }`,
		} );
		expect( media.mime_type ).toBe( 'video/webm' );
		expect( media.video_poster ).toMatch( /-poster\.jpg$/ );

		// The poster is a real JPEG the server can hand back.
		const response = await fetch( media.video_poster );
		expect( response.ok ).toBe( true );
		const bytes = new Uint8Array( await response.arrayBuffer() );
		expect( [ bytes[ 0 ], bytes[ 1 ] ] ).toEqual( [ 0xff, 0xd8 ] );
	} );
} );
