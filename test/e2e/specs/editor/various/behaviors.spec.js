/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Testing behaviors functionality', () => {
	const filename = '1024x768_e2e_test_image_size.jpeg';
	const filepath = path.join( './test/e2e/assets', filename );

	const createMedia = async ( { admin, requestUtils } ) => {
		await admin.createNewPost();
		const media = await requestUtils.uploadMedia( filepath );
		return media;
	};

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deleteAllPosts();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( '`No Behaviors` should be the default as defined in the core theme.json', async ( {
		admin,
		editor,
		requestUtils,
		page,
	} ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		const media = await createMedia( { admin, requestUtils } );
		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				alt: filename,
				id: media.id,
				url: media.source_url,
			},
		} );

		await page.getByRole( 'button', { name: 'Advanced' } ).click();
		const select = page.getByLabel( 'Behavior' );

		// By default, no behaviors should be selected.
		await expect( select ).toHaveCount( 1 );
		await expect( select ).toHaveValue( '' );

		// By default, you should be able to select the Lightbox behavior.
		const options = select.locator( 'option' );
		await expect( options ).toHaveCount( 2 );
	} );

	test( 'Behaviors UI can be disabled in the `theme.json`', async ( {
		admin,
		editor,
		requestUtils,
		page,
	} ) => {
		// { "lightbox": true } is the default behavior setting, so we activate the
		// `behaviors-ui-disabled` theme where it is disabled by default. Change if we change
		// the default value in the core theme.json file.
		await requestUtils.activateTheme( 'behaviors-ui-disabled' );
		const media = await createMedia( { admin, requestUtils } );

		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				alt: filename,
				id: media.id,
				url: media.source_url,
			},
		} );

		await page.getByRole( 'button', { name: 'Advanced' } ).click();

		// No behaviors dropdown should be present.
		await expect( page.getByLabel( 'Behavior' ) ).toHaveCount( 0 );
	} );

	test( "Block's value for behaviors takes precedence over the theme's value", async ( {
		admin,
		editor,
		requestUtils,
		page,
	} ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		const media = await createMedia( { admin, requestUtils } );

		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				alt: filename,
				id: media.id,
				url: media.source_url,
				// Explicitly set the value for behaviors to true.
				behaviors: { lightbox: true },
			},
		} );

		await page.getByRole( 'button', { name: 'Advanced' } ).click();
		const select = page.getByLabel( 'Behavior' );

		// The lightbox should be selected because the value from the block's
		// attributes takes precedence over the theme's value.
		await expect( select ).toHaveCount( 1 );
		await expect( select ).toHaveValue( 'lightbox' );

		// There should be 2 options available: `No behaviors` and `Lightbox`.
		const options = select.locator( 'option' );
		await expect( options ).toHaveCount( 2 );

		// We can change the value of the behaviors dropdown to `No behaviors`.
		await select.selectOption( { label: 'No behaviors' } );
		await expect( select ).toHaveValue( '' );

		// Here we should also check that the block renders on the frontend with the
		// lightbox even though the theme.json has it set to false.
	} );

	test( 'You can set the default value for the behaviors in the theme.json', async ( {
		admin,
		editor,
		requestUtils,
		page,
	} ) => {
		// In this theme, the default value for settings.behaviors.blocks.core/image.lightbox is `true`.
		await requestUtils.activateTheme( 'behaviors-enabled' );
		const media = await createMedia( { admin, requestUtils } );

		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				alt: filename,
				id: media.id,
				url: media.source_url,
			},
		} );

		await page.getByRole( 'button', { name: 'Advanced' } ).click();
		const select = page.getByLabel( 'Behavior' );

		// The behaviors dropdown should be present and the value should be set to
		// `lightbox`.
		await expect( select ).toHaveCount( 1 );
		await expect( select ).toHaveValue( 'lightbox' );

		// There should be 2 options available: `No behaviors` and `Lightbox`.
		const options = select.locator( 'option' );
		await expect( options ).toHaveCount( 2 );

		// We can change the value of the behaviors dropdown to `No behaviors`.
		await select.selectOption( { label: 'No behaviors' } );
		await expect( select ).toHaveValue( '' );
	} );
} );
