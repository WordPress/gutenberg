/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function navigateToTemplateEditor( { admin, editor, page } ) {
	await admin.visitAdminPage( 'edit.php', 'post_type=page' );
	await page.getByLabel( '“Privacy Policy” (Edit)' ).click();
	await page.getByRole( 'button', { name: 'Close' } ).click();

	await editor.openDocumentSettingsSidebar();
	const settingsPanel = page.getByRole( 'region', {
		name: 'Editor settings',
	} );
	await settingsPanel.getByRole( 'tab', { name: 'Page' } ).click();
	await settingsPanel
		.getByRole( 'button', { name: 'Template options' } )
		.click();
	await page.getByRole( 'menuitem', { name: 'Edit template' } ).click();
	await page.waitForSelector( 'iframe[name="editor-canvas"]' );
	await expect( editor.canvas.locator( 'body' ) ).toBeVisible();

	// Dismiss welcome guide if visible.
	const getStartedButton = page.getByRole( 'button', {
		name: 'Get started',
	} );
	if ( await getStartedButton.isVisible() ) {
		await getStartedButton.click();
	}
}

test.describe( 'Template ID Format', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyfive' );
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

		await navigateToTemplateEditor( { admin, editor, page } );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test content with experiment enabled' },
		} );
		await expect(
			editor.canvas.getByText( 'Test content with experiment enabled' )
		).toBeVisible();
		await expect( page.locator( 'body' ) ).not.toContainText(
			'No templates exist with that id.'
		);

		// Test with experiment disabled.
		await requestUtils.setGutenbergExperiments( [] );

		await navigateToTemplateEditor( { admin, editor, page } );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test content with experiment disabled' },
		} );
		await expect(
			editor.canvas.getByText( 'Test content with experiment disabled' )
		).toBeVisible();
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save' } )
			.click();

		await expect( page.locator( 'body' ) ).not.toContainText(
			'No templates exist with that id.'
		);
	} );
} );
