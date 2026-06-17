/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function enableFullscreenMode( page ) {
	// Open Options Menu
	await page
		.locator( 'role=region[name="Editor top bar"i]' )
		.getByRole( 'button', { name: 'Options' } )
		.click();

	// Select Full Screen Mode
	await page
		.locator( 'role=menuitemcheckbox', { hasText: 'Fullscreen mode' } )
		.click();
}

async function enableDistractionFreeMode( pageUtils ) {
	await pageUtils.pressKeys( 'primaryShift+\\' );
}

function getEditorTopBar( page ) {
	return page.getByRole( 'region', { name: 'Editor top bar' } );
}

function getPostEditorBackLink( page ) {
	return getEditorTopBar( page ).getByRole( 'link', {
		name: 'View Posts',
	} );
}

function getSiteEditorOpenNavigationButton( page ) {
	return getEditorTopBar( page ).getByRole( 'button', {
		name: 'Open Navigation',
	} );
}

test.describe( 'Fullscreen Mode', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
		await requestUtils.setGutenbergExperiments( [] );
		await requestUtils.resetPreferences();
	} );

	test( 'should open the fullscreen mode from the more menu', async ( {
		page,
		admin,
	} ) => {
		await admin.createNewPost();
		await enableFullscreenMode( page );

		// Check the body class.
		await expect( page.locator( 'body' ) ).toHaveClass(
			/is-fullscreen-mode/
		);

		await expect( page.locator( '#wpadminbar' ) ).toBeHidden();
		await expect( getPostEditorBackLink( page ) ).toBeVisible();
	} );

	test( 'should show the admin bar when the experiment is enabled', async ( {
		page,
		admin,
		requestUtils,
	} ) => {
		await requestUtils.setGutenbergExperiments( [ 'gutenberg-omnibar' ] );
		await admin.createNewPost();
		await enableFullscreenMode( page );

		await expect( page.locator( 'body' ) ).toHaveClass(
			/is-fullscreen-mode/
		);

		await expect( page.locator( '#wpadminbar' ) ).toBeVisible();
		await expect( getPostEditorBackLink( page ) ).toBeVisible();
	} );

	test( 'should hide the admin bar in distraction free mode when the experiment is enabled', async ( {
		page,
		admin,
		requestUtils,
		pageUtils,
	} ) => {
		await requestUtils.setGutenbergExperiments( [ 'gutenberg-omnibar' ] );
		await admin.createNewPost();
		await enableFullscreenMode( page );
		await enableDistractionFreeMode( pageUtils );

		await expect( page.locator( '.editor-editor-interface' ) ).toHaveClass(
			/is-distraction-free/
		);
		await expect( page.locator( '#wpadminbar' ) ).toBeHidden();
	} );

	test( 'should show the admin bar in distraction free mode on mobile when the experiment is enabled', async ( {
		page,
		admin,
		requestUtils,
		pageUtils,
	} ) => {
		await requestUtils.setGutenbergExperiments( [ 'gutenberg-omnibar' ] );
		await pageUtils.setBrowserViewport( 'small' );
		await admin.createNewPost();
		await enableDistractionFreeMode( pageUtils );

		await expect( page.locator( '.editor-editor-interface' ) ).toHaveClass(
			/is-distraction-free/
		);
		await expect( page.locator( '#wpadminbar' ) ).toBeVisible();
	} );

	test.describe( 'Site Editor', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'emptytheme' );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentyone' );
		} );

		test( 'should show the admin bar when the experiment is enabled', async ( {
			page,
			admin,
			requestUtils,
		} ) => {
			await requestUtils.setGutenbergExperiments( [
				'gutenberg-omnibar',
			] );
			await admin.visitSiteEditor( { canvas: 'edit' } );

			await expect( page.locator( '#wpadminbar' ) ).toBeVisible();
			await expect(
				getSiteEditorOpenNavigationButton( page )
			).toBeVisible();
		} );
	} );
} );
