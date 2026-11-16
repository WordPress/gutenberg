const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const audioPath = './assets/playlist-e2e-test.wav';

test.describe( 'Audio', () => {
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

	test( 'keeps the audio when a replacement upload fails, and Reset still removes it', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const media = await requestUtils.uploadMedia( audioPath );
		await editor.insertBlock( {
			name: 'core/audio',
			attributes: {
				id: media.id,
				src: media.source_url,
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
		await page
			.getByRole( 'menu' )
			.getByTestId( 'form-file-upload-input' )
			.setInputFiles( audioPath );
		await expect(
			page
				.getByTestId( 'snackbar' )
				.filter( { hasText: 'Simulated upload failure.' } )
		).toBeVisible();

		// The failed upload leaves the current audio and its caption.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/audio',
				attributes: {
					id: media.id,
					src: media.source_url,
					caption: 'Original caption',
				},
			},
		] );

		// Reset still removes the audio.
		await editor.clickBlockToolbarButton( 'Replace' );
		await page.getByRole( 'menuitem', { name: 'Reset' } ).click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/audio',
				attributes: {
					id: undefined,
					src: undefined,
					caption: undefined,
				},
			},
		] );
	} );
} );
