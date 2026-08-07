const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'HEIC upload error message', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'explains why the file failed and waits to be dismissed', async ( {
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

		/*
		 * The first sentence names the browser and operating system that failed,
		 * so it varies with the machine running the test. The rest of the
		 * message is the same everywhere.
		 */
		const notice = page.locator( '.components-snackbar' ).filter( {
			hasText: "we couldn't convert this one",
		} );
		await expect( notice ).toBeVisible( { timeout: 30_000 } );
		await expect( notice ).toContainText( 'JPEG' );

		// The block falls back to the placeholder so another image can be chosen.
		await expect(
			imageBlock.getByRole( 'button', { name: 'Media Library' } )
		).toBeVisible();

		/*
		 * Snackbars usually disappear on their own after a few seconds. This one
		 * has too much to read for that, so it stays until dismissed, which the
		 * dismiss button is the visible sign of.
		 */
		const dismissButton = notice.getByRole( 'button', {
			name: 'Dismiss this notice',
		} );
		await expect( dismissButton ).toBeVisible();

		await dismissButton.click();
		await expect( notice ).toBeHidden();
	} );
} );
