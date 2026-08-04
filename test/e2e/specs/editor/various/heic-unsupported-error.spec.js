/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'HEIC upload error message', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'names the browser when a HEIC file cannot be decoded', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);

		/*
		 * Bytes that are not a valid HEIC file, so every decoding strategy
		 * fails: `createImageBitmap()` rejects it, `ImageDecoder` has no HEIC
		 * support, and the container parser finds no HEVC bitstream to hand to
		 * `VideoDecoder`. This is the same dead end a real HEIC file reaches in
		 * a browser without platform HEVC codecs, such as Firefox.
		 */
		await imageBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( {
				name: 'IMG_1982.heic',
				mimeType: 'image/heic',
				buffer: Buffer.from( 'not a heic file' ),
			} );

		// Playwright drives Chromium here, so the message names Chrome. Every
		// browser gets its own name from the same detection.
		const notice = page.locator( '.components-snackbar' ).filter( {
			hasText: 'cannot convert HEIC images',
		} );
		await expect( notice ).toBeVisible( { timeout: 30_000 } );
		await expect( notice ).toContainText( 'Chrome' );
		await expect( notice ).toContainText( 'JPEG' );

		// The block falls back to the placeholder so another image can be chosen.
		await expect(
			imageBlock.getByRole( 'button', { name: 'Media Library' } )
		).toBeVisible();
	} );
} );
