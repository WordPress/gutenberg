/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Template Post Types Column', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.resetPreferences();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'REST API returns post_types field for templates', async ( {
		requestUtils,
	} ) => {
		const templates = await requestUtils.rest( {
			path: '/wp/v2/templates',
		} );

		// Find the custom-template which has postTypes: ["post"] in emptytheme's theme.json
		const customTemplate = templates.find(
			( t ) => t.slug === 'custom-template'
		);
		expect( customTemplate ).toBeDefined();
		expect( customTemplate.post_types ).toEqual( [ 'post' ] );

		// Find the full-width template which has postTypes: ["post", "page"]
		const fullWidthTemplate = templates.find(
			( t ) => t.slug === 'full-width'
		);
		expect( fullWidthTemplate ).toBeDefined();
		expect( fullWidthTemplate.post_types ).toEqual( [ 'post', 'page' ] );

		// Find the page-wide template which has postTypes: ["page"]
		const pageWideTemplate = templates.find(
			( t ) => t.slug === 'page-wide'
		);
		expect( pageWideTemplate ).toBeDefined();
		expect( pageWideTemplate.post_types ).toEqual( [ 'page' ] );

		// Index template should have empty post_types
		const indexTemplate = templates.find( ( t ) => t.slug === 'index' );
		expect( indexTemplate ).toBeDefined();
		expect( indexTemplate.post_types ).toEqual( [] );
	} );

	test( 'Post Types data is displayed in Templates table view', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor();
		await page.getByRole( 'button', { name: 'Templates' } ).click();

		// Switch to table view
		await page.getByRole( 'button', { name: 'Layout' } ).click();
		await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();

		// Wait for the table to appear
		const table = page.getByRole( 'table' );
		await expect( table ).toBeVisible();

		// Verify the Custom template row contains "post" for post types
		const customRow = table.getByRole( 'row', { name: /Custom/i } );
		await expect( customRow ).toBeVisible();
		await expect( customRow ).toContainText( 'post' );

		// Verify the Full Width template row contains "post, page"
		const fullWidthRow = table.getByRole( 'row', {
			name: /Full Width/i,
		} );
		await expect( fullWidthRow ).toBeVisible();
		await expect( fullWidthRow ).toContainText( 'post, page' );

		// Verify the Page: Wide template row contains "page"
		const pageWideRow = table.getByRole( 'row', {
			name: /Page: Wide/i,
		} );
		await expect( pageWideRow ).toBeVisible();
		await expect( pageWideRow ).toContainText( 'page' );
	} );
} );
