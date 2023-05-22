/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor command center', () => {
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

	test( 'Open the command center and navigate to the page create page', async ( {
		page,
	} ) => {
		await page.focus( 'role=button[name="Open command center"i]' );
		await page.keyboard.press( 'Meta+k' );
		await page.keyboard.type( 'new page' );
		const newPageButton = page.locator(
			'role=option[name="Add new page"i]'
		);
		await expect( newPageButton ).toBeVisible();
		await newPageButton.click();

		await page.waitForSelector( 'iframe[name="editor-canvas"]' );
		const frame = page.frame( 'editor-canvas' );
		await expect(
			frame.locator( 'role=textbox[name=/Add title/i]' )
		).toBeVisible();
	} );

	test( 'Open the command center and navigate to a template', async ( {
		page,
	} ) => {
		await page.click( 'role=button[name="Open command center"i]' );
		await page.keyboard.type( 'index' );
		await page.click( 'role=option[name="index"i]' );
		await expect( page.locator( 'h2' ) ).toHaveText( 'Index' );
	} );
} );
