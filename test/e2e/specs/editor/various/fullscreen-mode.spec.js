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

function getFirstDocumentTool( page ) {
	// With "Show button text labels" on, the inserter's accessible name is
	// "Add" rather than "Block Inserter".
	return getEditorTopBar( page )
		.getByRole( 'toolbar', { name: 'Document tools' } )
		.getByRole( 'button' )
		.first();
}

test.describe( 'Fullscreen Mode', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
		await requestUtils.resetPreferences();
	} );

	test( 'should show the admin bar', async ( { page, admin } ) => {
		await admin.createNewPost();
		await enableFullscreenMode( page );

		// Check the body class.
		await expect( page.locator( 'body' ) ).toHaveClass(
			/is-fullscreen-mode/
		);

		await expect( page.locator( '#wpadminbar' ) ).toBeVisible();
		await expect( getPostEditorBackLink( page ) ).toBeVisible();
	} );

	test( 'should hide the admin bar in distraction free mode', async ( {
		page,
		admin,
		pageUtils,
	} ) => {
		await admin.createNewPost();
		await enableFullscreenMode( page );
		await enableDistractionFreeMode( pageUtils );

		await expect( page.locator( '.editor-editor-interface' ) ).toHaveClass(
			/is-distraction-free/
		);
		await expect( page.locator( '#wpadminbar' ) ).toBeHidden();
	} );

	test( 'should show the admin bar in distraction free mode on mobile', async ( {
		page,
		admin,
		pageUtils,
	} ) => {
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

		test( 'should show the admin bar', async ( { page, admin } ) => {
			await admin.visitSiteEditor( { canvas: 'edit' } );

			await expect( page.locator( '#wpadminbar' ) ).toBeVisible();
			await expect(
				getSiteEditorOpenNavigationButton( page )
			).toBeVisible();
		} );

		test( 'should not obscure the back button when showing icon labels', async ( {
			page,
			admin,
			editor,
		} ) => {
			await admin.visitSiteEditor( { canvas: 'edit' } );
			await editor.setPreferences( 'core', {
				showIconLabels: true,
			} );

			const backButton = getSiteEditorOpenNavigationButton( page );
			await expect( backButton ).toBeVisible();

			await expectBackButtonNotObscured(
				backButton,
				getFirstDocumentTool( page )
			);
		} );
	} );

	test( 'should not obscure the back button when showing icon labels', async ( {
		page,
		admin,
		editor,
	} ) => {
		await admin.createNewPost();
		await editor.setPreferences( 'core', {
			showIconLabels: true,
		} );
		await enableFullscreenMode( page );

		await expect( page.locator( 'body' ) ).toHaveClass(
			/show-icon-labels/
		);

		const backLink = getPostEditorBackLink( page );
		await expect( backLink ).toBeVisible();

		await expectBackButtonNotObscured(
			backLink,
			getFirstDocumentTool( page )
		);
	} );
} );

/**
 * Assert that the back control is fully to the left of the following toolbar
 * control, so its label is not covered when "Show button text labels" is on.
 *
 * @param {import('@playwright/test').Locator} backControl
 * @param {import('@playwright/test').Locator} followingControl
 */
async function expectBackButtonNotObscured( backControl, followingControl ) {
	const backBox = await backControl.boundingBox();
	const followingBox = await followingControl.boundingBox();

	expect( backBox ).not.toBeNull();
	expect( followingBox ).not.toBeNull();
	expect( backBox.x + backBox.width ).toBeLessThanOrEqual( followingBox.x );
}
