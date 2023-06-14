/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Pages', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );
	test( 'Create a new page', async ( { admin, page } ) => {
		const pageName = 'demo';
		await admin.visitSiteEditor();
		await page.getByRole( 'button', { name: 'Pages' } ).click();
		await page.getByRole( 'button', { name: 'Draft a new page' } ).click();
		// Fill the page title and submit.
		const newPageDialog = page.locator(
			'role=dialog[name="Draft a new page"i]'
		);
		const pageTitleInput = newPageDialog.locator(
			'role=textbox[name="Page title"i]'
		);
		await pageTitleInput.fill( pageName );
		await page.keyboard.press( 'Enter' );
		await expect(
			page.locator(
				`role=button[name="Dismiss this notice"i] >> text="${ pageName }" successfully created.`
			)
		).toBeVisible();
	} );
} );
