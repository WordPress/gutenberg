/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/*
 * A small, valid HEIC. Chromium cannot decode it: `createImageBitmap()`
 * rejects it, `ImageDecoder` is not defined, and `VideoDecoder` reports no
 * HEVC support. That is the same dead end a real photo reaches in a browser
 * without platform HEVC codecs, such as Firefox.
 */
const heicFixture = fs.readFileSync(
	path.join(
		__dirname,
		'..',
		'..',
		'..',
		'assets',
		'64x64_e2e_test_image.heic'
	)
);

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

		await imageBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( {
				name: 'IMG_1982.heic',
				mimeType: 'image/heic',
				buffer: heicFixture,
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

	test( 'blames the file, not the browser, when the HEIC is damaged', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.locator(
			'role=document[name="Block: Image"i]'
		);

		/*
		 * The same file cut short, the way a partial copy or download leaves
		 * it: the container metadata is intact but the pixel data it points
		 * at is missing. No browser can decode this, so the message must not
		 * suggest switching to one that decodes HEIC.
		 */
		await imageBlock
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( {
				name: 'IMG_1983.heic',
				mimeType: 'image/heic',
				buffer: heicFixture.subarray( 0, 500 ),
			} );

		const notice = page.locator( '.components-snackbar' ).filter( {
			hasText: 'This HEIC image could not be converted',
		} );
		await expect( notice ).toBeVisible( { timeout: 30_000 } );
		await expect( notice ).not.toContainText( "we couldn't convert" );

		await expect(
			imageBlock.getByRole( 'button', { name: 'Media Library' } )
		).toBeVisible();
	} );
} );
