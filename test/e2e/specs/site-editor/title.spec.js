/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor title', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'displays the selected template name in the title for the index template', async ( {
		page,
		pageUtils,
	} ) => {
		// Navigate to a template.
		await pageUtils.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
		} );

		const title = await page.locator(
			'role=region[name="Header"] >> role=heading[level=1]'
		);

		await expect( await title.textContent() ).toEqual(
			'Editing template: Index'
		);
	} );

	test( 'displays the selected template name in the title for the header template', async ( {
		page,
		pageUtils,
	} ) => {
		// Navigate to a template part.
		await pageUtils.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
		} );

		const title = await page.locator(
			'role=region[name="Header"] >> role=heading[level=1]'
		);

		await expect( await title.textContent() ).toEqual(
			'Editing template part: header'
		);
	} );

	test( "displays the selected template part's name in the secondary title when a template part is selected from List View", async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
		} );

		// Select the header template part via list view.
		await page.click( 'role=button[name="List View"]' );
		const listView = await page.locator(
			'role=treegrid[name="Block navigation structure"]'
		);
		await listView.locator( 'a >> text="header"' ).click();
		await page.click( 'role=button[name="Close List View Sidebar"]' );

		// Evaluate the document settings secondary title.
		const secondaryTitle = await page.locator(
			'.edit-site-document-actions__secondary-item'
		);

		await expect( await secondaryTitle.textContent() ).toEqual( 'header' );
	} );
} );
