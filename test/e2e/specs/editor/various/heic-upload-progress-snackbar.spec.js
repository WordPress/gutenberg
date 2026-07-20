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
		// Disable full client-side media processing while leaving the
		// HEIC canvas-conversion mode active (`window.__heicUploadSupport`
		// is set regardless). This mirrors Safari, where full client-side
		// processing is unsupported but HEIC files are still converted to
		// JPEG via createImageBitmap + OffscreenCanvas before upload.
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
		await imageBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( {
				name: 'IMG_1982.heic',
				mimeType: 'image/heic',
				buffer,
			} );

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
