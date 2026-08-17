const fs = require( 'fs/promises' );
const os = require( 'os' );
const path = require( 'path' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Writes an OpenEXR file to a temporary directory and returns its path.
 *
 * WordPress does not allow OpenEXR uploads, and browsers do not map the
 * extension to a mime type either, so `File.type` is empty and both upload
 * paths deliberately pass the file to the server rather than guessing at its
 * type — which is why the rejection only arrives once the upload is under way.
 * The file has to come off disk for that: given a buffer, Playwright supplies a
 * mime type of its own, and the upload then fails in the browser instead.
 *
 * The bytes are the OpenEXR magic number, so anything that sniffs content sees
 * a plausible file rather than a truncated one.
 *
 * @return {Promise<string>} Path to the file.
 */
async function writeUnsupportedFile() {
	const directory = await fs.mkdtemp(
		path.join( os.tmpdir(), 'gutenberg-test-media-' )
	);
	const filePath = path.join( directory, 'openEXR.exr' );
	await fs.writeFile( filePath, Buffer.from( [ 0x76, 0x2f, 0x31, 0x01 ] ) );
	return filePath;
}

/**
 * Uploads a file the server rejects and asserts the editor never claims the
 * upload completed (regression: gutenberg#81708, gutenberg#81132).
 *
 * @param {Object} editor Editor utils.
 * @param {Object} page   Playwright page.
 */
async function expectNoCompletionForRejectedUpload( editor, page ) {
	await editor.insertBlock( { name: 'core/image' } );

	/*
	 * Record every notice as it is created. The completion snackbar dismisses
	 * itself after a few seconds, so looking for it in the DOM once the upload
	 * has settled would be a race — this catches it whenever it appears.
	 */
	await page.evaluate( () => {
		window.__uploadNotices = [];
		window.wp.data.subscribe( () => {
			const notices = window.wp.data
				.select( 'core/notices' )
				.getNotices();
			for ( const notice of notices ) {
				const isRecorded = window.__uploadNotices.some(
					( recorded ) =>
						recorded.id === notice.id &&
						recorded.content === notice.content
				);
				if ( ! isRecorded ) {
					window.__uploadNotices.push( {
						id: notice.id,
						content: notice.content,
					} );
				}
			}
		} );
	} );

	const imageBlock = editor.canvas.locator(
		'role=document[name="Block: Image"i]'
	);
	await imageBlock
		.locator( 'data-testid=form-file-upload-input' )
		.setInputFiles( await writeUnsupportedFile() );

	// The rejection reaches the user.
	const snackbarList = page.locator( '.components-snackbar-list' );
	await expect(
		snackbarList.getByText( /not allowed to upload this file type/ )
	).toBeVisible( { timeout: 30_000 } );

	// Wait for the batch to end: the progress notice is gone from the store.
	await page.waitForFunction(
		() =>
			! window.wp.data
				.select( 'core/notices' )
				.getNotices()
				.some( ( notice ) => notice.id === 'upload-progress' ),
		undefined,
		{ timeout: 30_000 }
	);

	const noticeContents = (
		await page.evaluate( () => window.__uploadNotices )
	).map( ( notice ) => notice.content );

	// The upload has to have started for this test to mean anything: without
	// the progress snackbar there is no completion snackbar to get wrong.
	expect(
		noticeContents.filter( ( content ) => /^Uploading/.test( content ) )
	).not.toEqual( [] );
	expect( noticeContents ).not.toContain( 'Upload complete' );
}

test.describe( 'Upload progress snackbar (server-side uploads)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// Force the traditional server-side upload path, mirroring a site
		// where the `wp_client_side_media_processing_enabled` filter returns
		// false or the browser lacks client-side processing support.
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-disable-client-side-media-processing'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-disable-client-side-media-processing'
		);
	} );

	test( 'completes and dismisses when uploading to an image block', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);
		await imageBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( './assets/10x10_e2e_test_image_z9T8jK.png' );

		// Wait for the upload to finish: the image src flips from a blob URL
		// to the final uploaded URL.
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toHaveAttribute( 'src', /^https?:\/\//, {
			timeout: 30_000,
		} );

		// The progress snackbar must transition to its completion state and
		// not remain stuck at "Uploading" (regression: gutenberg#80343).
		const snackbarList = page.locator( '.components-snackbar-list' );
		await expect( snackbarList.getByText( 'Upload complete' ) ).toBeVisible(
			{ timeout: 10_000 }
		);
		await expect( snackbarList.getByText( /^Uploading/ ) ).toBeHidden();

		// The completion snackbar dismisses itself shortly after.
		await expect( snackbarList.getByText( 'Upload complete' ) ).toBeHidden(
			{ timeout: 10_000 }
		);
	} );

	// eslint-disable-next-line playwright/expect-expect -- Asserted in the shared helper.
	test( 'does not claim completion for a file the server rejects', async ( {
		editor,
		page,
	} ) => {
		await expectNoCompletionForRejectedUpload( editor, page );
	} );
} );

test.describe( 'Upload progress snackbar (client-side media processing)', () => {
	test.beforeEach( async ( { admin, page } ) => {
		await admin.createNewPost();

		// Client-side processing needs cross-origin isolation and friends;
		// where the browser cannot provide them the editor falls back to the
		// server-side path, which the describe above already covers.
		const isActive = await page.evaluate(
			() => window.__clientSideMediaProcessing === true
		);
		// eslint-disable-next-line playwright/no-skipped-test -- Depends on runtime browser support.
		test.skip(
			! isActive,
			'Client-side media processing is not active in this environment'
		);
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	// eslint-disable-next-line playwright/expect-expect -- Asserted in the shared helper.
	test( 'does not claim completion for a file the server rejects', async ( {
		editor,
		page,
	} ) => {
		await expectNoCompletionForRejectedUpload( editor, page );
	} );
} );
