/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor command palette', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
			requestUtils.deleteAllPages(),
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		// Navigate to the site editor.
		await admin.visitSiteEditor();
	} );

	test( 'Open the command palette and navigate to the page create page', async ( {
		editor,
		page,
	} ) => {
		await editor.setPreferences( 'core/edit-post', {
			welcomeGuide: false,
		} );

		await page
			.getByRole( 'button', { name: 'Open command palette' } )
			.click();
		await page
			.getByRole( 'combobox', { name: 'Search commands and settings' } )
			.fill( 'add page' );
		await page
			.getByRole( 'option', { name: 'Go to: Pages > Add Page' } )
			.click();
		await expect( page ).toHaveURL(
			/\/wp-admin\/post-new.php\?post_type=page/
		);
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'No title · Page' } )
		).toBeVisible();
	} );

	test( 'Open the command palette and navigate to a template', async ( {
		page,
	} ) => {
		await page
			.getByRole( 'button', { name: 'Open command palette' } )
			.click();
		await page.keyboard.type( 'index' );
		await page.getByRole( 'option', { name: 'index' } ).click();
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'heading', { level: 1 } )
		).toContainText( 'Index' );
	} );

	test( 'Open the command palette and navigate to Customize CSS', async ( {
		page,
	} ) => {
		await page
			.getByRole( 'button', { name: 'Open command palette' } )
			.click();
		await page.keyboard.type( 'custom CSS' );
		await page.getByRole( 'option', { name: 'Open custom CSS' } ).click();
		await expect( page.getByLabel( 'Additional CSS' ) ).toBeVisible();
	} );

	test( 'Suggestions section shows contextual commands on open', async ( {
		page,
	} ) => {
		await page
			.getByRole( 'button', { name: 'Open command palette' } )
			.click();

		const list = page.getByRole( 'listbox', {
			name: 'Command suggestions',
		} );

		// The Suggestions heading should be visible with contextual commands.
		await expect( list.getByText( 'Suggestions' ) ).toBeVisible();
		await expect(
			list.getByRole( 'option', { name: /Go to: Styles/ } )
		).toBeVisible();
	} );

	test( 'Results section appears during search', async ( { page } ) => {
		await page
			.getByRole( 'button', { name: 'Open command palette' } )
			.click();
		await page.keyboard.type( 'styles' );

		const list = page.getByRole( 'listbox', {
			name: 'Command suggestions',
		} );

		// Results heading should appear, Suggestions should not.
		await expect( list.getByText( 'Results' ) ).toBeVisible();
		await expect( list.getByText( 'Suggestions' ) ).not.toBeVisible();
	} );

	test( 'Recent commands show after using a command', async ( {
		page,
		admin,
	} ) => {
		// Use a command first: navigate to a template via search.
		await page
			.getByRole( 'button', { name: 'Open command palette' } )
			.click();
		await page.keyboard.type( 'index' );
		await page.getByRole( 'option', { name: 'index' } ).click();
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'heading', { level: 1 } )
		).toContainText( 'Index' );

		// Go back to site editor root and reopen the palette.
		await admin.visitSiteEditor();
		await page
			.getByRole( 'button', { name: 'Open command palette' } )
			.click();

		const list = page.getByRole( 'listbox', {
			name: 'Command suggestions',
		} );

		// The Recent heading should be visible with the previously used command.
		await expect( list.getByText( 'Recent' ) ).toBeVisible();
		await expect(
			list.getByRole( 'option', { name: /index/i } )
		).toBeVisible();
	} );
} );
