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
		page,
	} ) => {
		await page
			.getByRole( 'button', { name: 'Open command palette' } )
			.click();
		await page
			.getByRole( 'combobox', { name: 'Search commands and settings' } )
			.fill( 'new' );
		await page.getByRole( 'option', { name: 'Add Page' } ).click();
		await expect( page ).toHaveURL(
			/\/wp-admin\/site-editor.php\?p=%2Fpage%2F(\d+)&canvas=edit/
		);
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'No title · Page' } )
		).toBeVisible();
	} );

	test( 'Open the command palette and create page using "create" keyword', async ( {
		page,
	} ) => {
		await page
			.getByRole( 'button', { name: 'Open command palette' } )
			.click();
		await page
			.getByRole( 'combobox', { name: 'Search commands and settings' } )
			.fill( 'create' );
		await page.getByRole( 'option', { name: 'Add Page' } ).click();
		await expect( page ).toHaveURL(
			/\/wp-admin\/site-editor.php\?p=%2Fpage%2F(\d+)&canvas=edit/
		);
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'No title · Page' } )
		).toBeVisible();
	} );

	test( 'Open the command palette and create post using "create" keyword', async ( {
		page,
	} ) => {
		await page
			.getByRole( 'button', { name: 'Open command palette' } )
			.click();
		await page
			.getByRole( 'combobox', { name: 'Search commands and settings' } )
			.fill( 'create' );
		await page.getByRole( 'option', { name: 'Add Post' } ).click();
		await expect( page ).toHaveURL( /\/wp-admin\/post-new\.php/ );
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
		await page.keyboard.type( 'Customize' );
		await page.getByRole( 'option', { name: 'customize css' } ).click();
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByLabel( 'Additional CSS' )
		).toBeVisible();
	} );
} );
