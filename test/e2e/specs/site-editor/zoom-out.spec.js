/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// The test is flaky and fails almost consistently.
// See: https://github.com/WordPress/gutenberg/issues/61806.
// eslint-disable-next-line playwright/no-skipped-test
test.describe.skip( 'Zoom Out', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin, editor, page } ) => {
		await admin.visitAdminPage( 'admin.php', 'page=gutenberg-experiments' );

		const zoomedOutCheckbox = page.getByLabel(
			'Enable zoomed out view when selecting a pattern category in the main inserter.'
		);

		await zoomedOutCheckbox.setChecked( true );
		await expect( zoomedOutCheckbox ).toBeChecked();
		await page.getByRole( 'button', { name: 'Save Changes' } ).click();

		await admin.visitSiteEditor();
		await editor.canvas.locator( 'body' ).click();
	} );

	test.afterEach( async ( { admin, page } ) => {
		await admin.visitAdminPage( 'admin.php', 'page=gutenberg-experiments' );
		const zoomedOutCheckbox = page.getByLabel(
			'Enable zoomed out view when selecting a pattern category in the main inserter.'
		);
		await zoomedOutCheckbox.setChecked( false );
		await expect( zoomedOutCheckbox ).not.toBeChecked();
		await page.getByRole( 'button', { name: 'Save Changes' } ).click();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Clicking on inserter while on zoom-out should open the patterns tab on the inserter', async ( {
		page,
	} ) => {
		// Trigger zoom out on Global Styles because there the inserter is not open.
		await page.getByRole( 'button', { name: 'Styles' } ).click();
		await page.getByRole( 'button', { name: 'Browse styles' } ).click();

		// select the 1st pattern
		await page
			.frameLocator( 'iframe[name="editor-canvas"]' )
			.locator( 'header' )
			.click();

		await expect( page.getByLabel( 'Add pattern' ) ).toHaveCount( 3 );
		await page.getByLabel( 'Add pattern' ).first().click();
		await expect( page.getByLabel( 'Add pattern' ) ).toHaveCount( 2 );

		await expect(
			page
				.locator( '#tabs-2-allPatterns-view div' )
				.filter( { hasText: 'All' } )
				.nth( 1 )
		).toBeVisible();
	} );
} );
