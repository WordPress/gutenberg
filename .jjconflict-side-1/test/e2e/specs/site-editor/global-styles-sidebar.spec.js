const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Global styles sidebar', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'should reset a block typography value through the panel menu', async ( {
		page,
	} ) => {
		// Global styles panels stay mounted as their `panelId` changes, so
		// stale ToolsPanel menu state survives here long enough to be seen.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();

		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		await settings.getByRole( 'button', { name: 'Blocks' } ).click();
		await settings
			.getByRole( 'button', { name: 'Heading', exact: true } )
			.click();
		await settings.getByRole( 'button', { name: 'Typography' } ).click();

		const typographyOptions = settings.getByRole( 'button', {
			name: /Typography options/i,
		} );
		const resetAll = page.getByRole( 'menuitem', { name: 'Reset all' } );

		await settings
			.getByRole( 'group', { name: 'Letter case' } )
			.getByRole( 'button', { name: 'Uppercase' } )
			.click();

		// The panel now has something to reset.
		await typographyOptions.click();
		await expect( resetAll ).toHaveAttribute( 'aria-disabled', 'false' );

		await resetAll.click();

		// The menu stays open, and the panel reports nothing left to reset.
		await expect( resetAll ).toHaveAttribute( 'aria-disabled', 'true' );
		await page.keyboard.press( 'Escape' );

		await expect(
			settings
				.getByRole( 'group', { name: 'Letter case' } )
				.getByRole( 'button', { name: 'Uppercase' } )
		).toHaveAttribute( 'aria-pressed', 'false' );
	} );

	test( 'should filter blocks list results', async ( { page } ) => {
		// Navigate to Styles -> Blocks.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Blocks' } )
			.click();

		await page
			.getByRole( 'searchbox', { name: 'Search' } )
			.fill( 'heading' );

		// Matches both Heading and Accordion Item blocks.
		// The latter contains "heading" in its description.
		await expect(
			page.getByRole( 'button', { name: 'Heading', exact: true } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Accordion Item' } )
		).toBeVisible();
	} );
} );
