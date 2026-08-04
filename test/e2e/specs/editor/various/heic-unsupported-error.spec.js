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

	test( 'reports an undecodable HEIC file in the Image block', async ( {
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

		// The error is rendered in the block, not in a snackbar that would
		// dismiss itself before it could be read.
		const notice = imageBlock.locator(
			'.wp-block-image__upload-error-notice'
		);
		await expect( notice ).toBeVisible( { timeout: 30_000 } );
		await expect( notice ).toContainText( 'cannot convert HEIC images' );
		await expect( notice ).toContainText( 'JPEG' );

		await expect(
			page.locator( '.components-snackbar' ).filter( {
				hasText: 'cannot convert HEIC images',
			} )
		).toBeHidden();

		// The message can be copied for pasting into a search or support request.
		await expect(
			notice.getByRole( 'button', { name: 'Copy error message' } )
		).toBeVisible();

		// The block falls back to the placeholder so another image can be chosen.
		await expect(
			imageBlock.getByRole( 'button', { name: 'Media Library' } )
		).toBeVisible();
	} );
} );
