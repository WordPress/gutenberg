/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor command palette', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
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
			.focus();
		await page.keyboard.press( 'Meta+k' );
		await page.keyboard.type( 'new page' );
		await page.getByRole( 'option', { name: 'Add new page' } ).click();
		await page.waitForSelector( 'iframe[name="editor-canvas"]' );
		const frame = page.frame( 'editor-canvas' );
		await expect( page ).toHaveURL(
			'/wp-admin/post-new.php?post_type=page'
		);
		await expect(
			frame.getByRole( 'textbox', { name: 'Add title' } )
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
		await expect( page.getByRole( 'heading', { level: 1 } ) ).toHaveText(
			'Index'
		);
	} );
} );
