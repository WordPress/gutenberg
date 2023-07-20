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

	test( 'should not show the Add Template Part button', async ( {
		admin,
		page,
	} ) => {
		await admin.visitAdminPage(
			'/site-editor.php',
			'postType=wp_template_part&path=/wp_template_part/all'
		);

		await expect(
			page.locator( 'role=button[name="Add New Template Part"i]' )
		).toBeHidden();

		// Back to Patterns page.
		await page.click(
			'role=region[name="Navigation"i] >> role=button[name="Back"i]'
		);

		await page.click(
			'role=region[name="Navigation"i] >> role=button[name="Create pattern"i]'
		);

		await expect(
			page.locator( 'role=menuitem[name="Create template part"i]' )
		).toBeHidden();
	} );

	test( 'can access template parts list page', async ( { admin, page } ) => {
		await admin.visitAdminPage(
			'site-editor.php',
			'postType=wp_template_part&path=/wp_template_part/all'
		);

		await expect(
			page.getByRole( 'table' ).getByRole( 'link', { name: 'header' } )
		).toBeVisible();
	} );

	test( 'can view a template part', async ( { admin, editor, page } ) => {
		await admin.visitAdminPage(
			'site-editor.php',
			'postType=wp_template_part&path=/wp_template_part/all'
		);

		const templatePart = page
			.getByRole( 'table' )
			.getByRole( 'link', { name: 'header' } );

		await expect( templatePart ).toBeVisible();
		await templatePart.click();

		await expect(
			page.getByRole( 'region', { name: 'Editor content' } )
		).toBeVisible();

		await editor.canvas.click( 'body' );

		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Site Title',
			} )
		).toBeVisible();
	} );
} );
