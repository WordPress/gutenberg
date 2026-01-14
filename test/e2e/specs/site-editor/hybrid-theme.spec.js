/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Hybrid theme', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptyhybrid' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'can access Patterns page', async ( { admin, page } ) => {
		await admin.visitAdminPage( 'site-editor.php', 'path=/patterns' );

		await expect(
			page.getByRole( 'heading', { level: 1, text: 'Patterns' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'heading', { level: 2, text: 'All patterns' } )
		).toBeVisible();
	} );

	test( 'should redirect to Patterns page when accessing template parts list page', async ( {
		admin,
		page,
	} ) => {
		await admin.visitAdminPage(
			'site-editor.php',
			'path=/wp_template_part/all'
		);

		await expect( page ).toHaveURL(
			'/wp-admin/site-editor.php?p=%2Fpattern&postType=wp_template_part'
		);

		await expect(
			page.getByRole( 'heading', { level: 1, text: 'Patterns' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'heading', { level: 2, text: 'All patterns' } )
		).toBeVisible();
	} );

	test( 'can view a template part list', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitAdminPage( 'site-editor.php', 'path=/patterns' );

		await page
			.getByRole( 'button', { name: 'All template parts' } )
			.click();
		await page.getByText( 'header', { exact: true } ).click();

		await expect(
			page.getByRole( 'region', { name: 'Editor content' } )
		).toBeVisible();

		await editor.canvas.locator( 'body' ).click();

		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Site Title',
			} )
		).toBeVisible();

		await expect(
			page.locator( 'role=dialog[name="Welcome to the site editor"i]' )
		).toBeHidden();
	} );

	test( 'can not export Site Editor Templates', async ( { admin, page } ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/emptyhybrid//header',
			postType: 'wp_template_part',
			canvas: 'edit',
		} );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();

		await expect(
			page.getByRole( 'menuitem', { name: 'Export' } )
		).toBeHidden();
	} );
} );
