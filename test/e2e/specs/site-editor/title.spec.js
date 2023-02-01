/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor title', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'displays the selected template name in the title for the index template', async ( {
		admin,
		page,
		siteEditor,
	} ) => {
		// Navigate to a template.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
		} );
		await siteEditor.enterEditMode();
		const title = await page.locator(
			'role=region[name="Editor top bar"i] >> role=heading[level=1]'
		);

		await expect( title ).toHaveText( 'Editing template: Index' );
	} );

	test( 'displays the selected template name in the title for the header template', async ( {
		admin,
		page,
		siteEditor,
	} ) => {
		// Navigate to a template part.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
		} );
		await siteEditor.enterEditMode();
		const title = await page.locator(
			'role=region[name="Editor top bar"i] >> role=heading[level=1]'
		);

		await expect( title ).toHaveText( 'Editing template part: header' );
	} );

	test( "displays the selected template part's name in the secondary title when a template part is selected from List View", async ( {
		admin,
		page,
		siteEditor,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
		} );
		await siteEditor.enterEditMode();
		// Select the header template part via list view.
		await page.click( 'role=button[name="List View"i]' );
		const listView = await page.locator(
			'role=treegrid[name="Block navigation structure"i]'
		);
		await listView.locator( 'role=gridcell >> text="header"' ).click();
		await page.click( 'role=button[name="Close List View Sidebar"i]' );

		// Evaluate the document settings secondary title.
		const secondaryTitle = await page.locator(
			'.edit-site-document-actions__secondary-item'
		);

		await expect( secondaryTitle ).toHaveText( 'header' );
	} );
} );
