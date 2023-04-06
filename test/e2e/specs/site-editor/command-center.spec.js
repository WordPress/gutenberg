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

	test.skip( 'Open the command center and navigate to the page create page', async ( {
		page,
	} ) => {
		await page.keyboard.press( 'Meta+k' );
		const newPageButton = page.locator(
			'role=option[name="Create a new page"i]'
		);
		await expect( newPageButton ).toBeVisible();

		// Type a random post title
		await page.keyboard.type( 'E2E Test Post' );
		await page.click(
			'role=option[name="Create a new post \\"E2E Test Post\\""i]'
		);

		await page.waitForSelector( 'iframe[name="editor-canvas"]' );
		const frame = page.frame( 'editor-canvas' );
		const postTitleInput = frame.locator(
			'role=textbox[name=/Add title/i]'
		);
		await expect( postTitleInput ).toHaveText( 'E2E Test Post' );
	} );

	test.skip( 'Open the command center and navigate to a template', async ( {
		page,
	} ) => {
		await page.keyboard.press( 'Meta+k' );

		await page.keyboard.type( 'index' );
		await page.click( 'role=option[name="index"i]' );
		await expect( page.locator( 'h2' ) ).toHaveText( 'Index' );
	} );
} );
