/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Template ID Format', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.activateTheme( 'twentytwentyone' );
		// Ensure experiment is disabled after test.
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'should open and edit templates correctly regardless of experiment status', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		// Test with experiment enabled first.
		await requestUtils.setGutenbergExperiments( [ 'active_templates' ] );

		await admin.visitAdminPage(
			'site-editor.php',
			'p=/wp_template/emptytheme//index&canvas=edit'
		);

		await page.waitForSelector( 'iframe[name="editor-canvas"]' );
		await expect( editor.canvas.locator( 'body' ) ).toBeVisible();

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test content with experiment enabled' },
		} );
		await expect(
			editor.canvas.getByText( 'Test content with experiment enabled' )
		).toBeVisible();

		// Test with experiment disabled.
		await requestUtils.setGutenbergExperiments( [] );

		await admin.visitAdminPage(
			'site-editor.php',
			'p=/wp_template/emptytheme//index&canvas=edit'
		);

		await page.waitForSelector( 'iframe[name="editor-canvas"]' );
		await expect( editor.canvas.locator( 'body' ) ).toBeVisible();

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test content with experiment disabled' },
		} );
		await expect(
			editor.canvas.getByText( 'Test content with experiment disabled' )
		).toBeVisible();
	} );
} );
