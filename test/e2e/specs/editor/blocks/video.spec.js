const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Video', () => {
	test.beforeAll( async ( { requestUtils } ) => {
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

	test( 'keeps the video when a replacement upload fails, and Reset still removes it', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const poster = await requestUtils.uploadMedia(
			'./assets/10x10_e2e_test_image_z9T8jK.png'
		);
		const src = 'https://example.com/e2e-test-video.mp4';
		await editor.insertBlock( {
			name: 'core/video',
			attributes: {
				src,
				poster: poster.source_url,
				caption: 'Original caption',
			},
		} );

		// Make the replacement upload fail on the server.
		await page.route( '**/wp/v2/media**', async ( route ) => {
			if ( route.request().method() !== 'POST' ) {
				return route.continue();
			}
			await route.fulfill( {
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify( {
					code: 'simulated_failure',
					message: 'Simulated upload failure.',
				} ),
			} );
		} );

		await editor.clickBlockToolbarButton( 'Replace' );
		// The upload fails before the server reads the file, so its content
		// does not matter.
		await page
			.getByRole( 'menu' )
			.getByTestId( 'form-file-upload-input' )
			.setInputFiles( {
				name: 'e2e-test-video.mp4',
				mimeType: 'video/mp4',
				buffer: Buffer.from( 'video' ),
			} );
		await expect(
			page
				.getByTestId( 'snackbar' )
				.filter( { hasText: 'Simulated upload failure.' } )
		).toBeVisible();

		// The failed upload leaves the current video, poster and caption.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/video',
				attributes: {
					src,
					poster: poster.source_url,
					caption: 'Original caption',
				},
			},
		] );

		// Reset still removes the video.
		await editor.clickBlockToolbarButton( 'Replace' );
		await page.getByRole( 'menuitem', { name: 'Reset' } ).click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/video',
				attributes: {
					src: undefined,
					poster: undefined,
					caption: undefined,
				},
			},
		] );
	} );
} );
