/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Upload progress snackbar (HEIC-only canvas mode) (@webkit)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// Disable cross-origin isolation while leaving client-side media
		// processing enabled: without SharedArrayBuffer the full VIPS
		// pipeline fails feature detection, so the editor falls back to the
		// HEIC canvas-conversion mode. This mirrors Safari, where full
		// client-side processing is unsupported but HEIC files are still
		// converted to JPEG via createImageBitmap + OffscreenCanvas before
		// upload.
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-disable-cross-origin-isolation'
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
			'gutenberg-test-plugin-disable-cross-origin-isolation'
		);
	} );

	test( 'counts a single HEIC upload as one file', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		// A JPEG payload with an `image/heic` MIME type: the HEIC-only mode
		// routes files by type, and `createImageBitmap()` decodes by content,
		// so this exercises the exact HEIC conversion pipeline in Chromium,
		// which cannot decode real HEIC data.
		const buffer = fs.readFileSync(
			path.join(
				__dirname,
				'..',
				'..',
				'..',
				'assets',
				'1024x768_e2e_test_image_size.jpeg'
			)
		);

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);

		// The canvas conversion mode sideloads the converted JPEG. A plain
		// server-side upload never hits the sideload endpoint, so waiting for
		// it proves the HEIC canvas path actually ran: the server also
		// content-sniffs the fake HEIC's JPEG bytes and renames the file, so
		// the src assertion below cannot tell the two paths apart on its own.
		const sideloadRequest = page.waitForRequest(
			( request ) =>
				request.method() === 'POST' &&
				request.url().includes( 'sideload' ),
			{ timeout: 60_000 }
		);

		await imageBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( {
				name: 'IMG_1982.heic',
				mimeType: 'image/heic',
				buffer,
			} );

		await sideloadRequest;

		const snackbarList = page.locator( '.components-snackbar-list' );

		// A single file must use the single-file message throughout. The
		// double-counted state ("Uploading 1 of 2 — …") appears mid-upload,
		// so race it against the completion snackbar: completion has to win
		// (regression: gutenberg#80369).
		const multiFileText = snackbarList.getByText( /Uploading \d+ of \d+/ );
		const completeText = snackbarList.getByText( 'Upload complete' );
		const outcome = await Promise.race( [
			multiFileText
				.waitFor( { state: 'visible', timeout: 60_000 } )
				.then( () => 'multi-file count shown' )
				.catch( () => 'multi-file text never appeared' ),
			completeText
				.waitFor( { state: 'visible', timeout: 60_000 } )
				.then( () => 'upload complete' )
				.catch( () => 'completion snackbar never appeared' ),
		] );
		expect( outcome ).toBe( 'upload complete' );

		// The HEIC file was converted client-side and uploaded as a JPEG.
		const image = imageBlock.getByRole( 'img', {
			name: 'This image has an empty alt attribute',
		} );
		await expect( image ).toHaveAttribute( 'src', /IMG_1982.*\.jpg/, {
			timeout: 30_000,
		} );
	} );
} );
