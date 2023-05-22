/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Templates', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
	} );
	test( 'Create a custom template', async ( { admin, page } ) => {
		const templateName = 'demo';
		await admin.visitSiteEditor();
		await page.click( 'role=button[name="Templates"]' );
		await page.click( 'role=button[name="Add New Template"i]' );
		await page
			.getByRole( 'button', {
				name: 'A custom template can be manually applied to any post or page.',
			} )
			.click();
		// Fill the template title and submit.
		const newTemplateDialog = page.locator(
			'role=dialog[name="Create custom template"i]'
		);
		const templateNameInput = newTemplateDialog.locator(
			'role=textbox[name="Name"i]'
		);
		await templateNameInput.fill( templateName );
		await page.keyboard.press( 'Enter' );
		// Close the pattern suggestions dialog.
		await page
			.getByRole( 'dialog', { name: 'Choose a pattern' } )
			.getByRole( 'button', { name: 'Close' } )
			.click();
		await expect(
			page.locator(
				`role=button[name="Dismiss this notice"i] >> text="${ templateName }" successfully created.`
			)
		).toBeVisible();
	} );
} );
