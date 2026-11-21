import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/*
 * Lives under `specs/site-editor/` so it also runs against the extensible
 * site editor (`test:e2e:site-editor-v2`). The snackbar's behaviour is covered
 * in `specs/editor/various/upload-progress-snackbar.spec.js`; this checks that
 * the site editor mounts it.
 */
test.describe( 'Site Editor upload progress snackbar', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			// Use the server-side upload path.
			requestUtils.activatePlugin(
				'gutenberg-test-plugin-disable-client-side-media-processing'
			),
		] );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
			requestUtils.deactivatePlugin(
				'gutenberg-test-plugin-disable-client-side-media-processing'
			),
		] );
	} );

	test( 'shows the completion notice after uploading to an image block', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await editor.insertBlock( { name: 'core/image' } );

		await editor.canvas
			.locator( 'role=document[name="Block: Image"i]' )
			.locator( 'data-testid=form-file-upload-input' )
			.setInputFiles( './assets/10x10_e2e_test_image_z9T8jK.png' );

		await expect(
			page
				.locator( '.components-snackbar-list' )
				.getByText( 'Upload complete' )
		).toBeVisible( { timeout: 30_000 } );
	} );
} );
