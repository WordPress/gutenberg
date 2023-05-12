/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Testing behaviors functionality', () => {
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deleteAllPosts();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'Lightbox option should be selected in an image block, as defined in theme.json', async ( {
		admin,
		editor,
		requestUtils,
		page,
	} ) => {
		await admin.createNewPost();
		const filename = '1024x768_e2e_test_image_size.jpeg';
		const filepath = path.join( './test/e2e/assets', filename );

		await admin.createNewPost();
		const media = await requestUtils.uploadMedia( filepath );

		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				alt: filename,
				id: media.id,
				url: media.source_url,
			},
		} );

		await page.getByRole( 'button', { name: 'Advanced' } ).click();
		await expect( page.getByLabel( 'Behavior' ) ).toHaveCount( 1 );
		await expect( page.getByLabel( 'Behavior' ) ).toHaveValue( 'lightbox' );
	} );

	test( 'None option should be selected in an image block, as defined in theme.json', async ( {
		admin,
		editor,
		requestUtils,
		page,
	} ) => {
		// Lightbox is the default behavior, so we need a theme that has it disabled. Change if we change the default.
		await requestUtils.activateTheme( 'behaviors' );
		await admin.createNewPost();

		const filename = '1024x768_e2e_test_image_size.jpeg';
		const filepath = path.join( './test/e2e/assets', filename );

		await admin.createNewPost();
		const media = await requestUtils.uploadMedia( filepath );

		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				alt: filename,
				id: media.id,
				url: media.source_url,
			},
		} );

		await page.getByRole( 'button', { name: 'Advanced' } ).click();
		// Right now the selector should not appear.
		await expect( page.getByLabel( 'Behavior' ) ).toHaveCount( 0 );
	} );
} );
