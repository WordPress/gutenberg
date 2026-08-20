const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Global styles sidebar', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.resetThemeGlobalStyles();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.resetThemeGlobalStyles();
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'does not apply the item separator to the shadow-row action button', async ( {
		page,
	} ) => {
		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();
		await editorSettings.getByRole( 'button', { name: 'Shadows' } ).click();
		await editorSettings
			.getByRole( 'button', { name: 'Add shadow' } )
			.click();
		await editorSettings
			.getByRole( 'button', { name: 'Shadow 1' } )
			.click();
		await editorSettings
			.getByRole( 'button', { name: 'Add shadow' } )
			.click();

		const removeButtons = editorSettings.getByRole( 'button', {
			name: 'Remove shadow',
		} );
		const shadowList = editorSettings.getByRole( 'list' ).filter( {
			has: page.getByRole( 'button', { name: 'Remove shadow' } ),
		} );

		await expect( removeButtons ).toHaveCount( 2 );
		await expect( shadowList.getByRole( 'listitem' ) ).toHaveCount( 2 );
		await expect( removeButtons.first() ).toHaveCSS(
			'border-bottom-color',
			'rgba(0, 0, 0, 0)'
		);
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
