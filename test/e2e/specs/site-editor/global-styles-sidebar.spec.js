/**
 * WordPress dependencies
 */
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

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPages();
		const globalStylesId =
			await requestUtils.getCurrentThemeGlobalStylesPostId();
		if ( globalStylesId ) {
			await requestUtils.rest( {
				method: 'PUT',
				path: `/wp/v2/global-styles/${ globalStylesId }`,
				data: {
					styles: {},
					settings: {},
				},
			} );
		}
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
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

	test( 'should create CSS classes and show current usages', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Styled paragraph',
				className: 'featured-card',
			},
		} );

		const paragraph = editor.canvas.getByText( 'Styled paragraph' );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();
		await page.getByRole( 'button', { name: 'CSS classes' } ).click();
		await page.getByRole( 'button', { name: 'Add class' } ).click();
		await page
			.getByRole( 'textbox', { name: 'Class name' } )
			.fill( 'featured-card' );
		await page
			.getByRole( 'textbox', { name: 'CSS' } )
			.fill( 'color: rgb(255, 0, 0);' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Save' } )
			.click();

		await expect(
			page.getByRole( 'button', { name: '.featured-card' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: '1 use' } )
		).toBeVisible();
		await expect( paragraph ).toHaveCSS( 'color', 'rgb(255, 0, 0)' );

		await page.getByRole( 'button', { name: '1 use' } ).click();
		await expect(
			page.getByRole( 'heading', { name: 'Usages of .featured-card' } )
		).toBeVisible();
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Paragraph' } )
		).toBeVisible();
	} );
} );
