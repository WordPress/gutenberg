/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

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
} );
