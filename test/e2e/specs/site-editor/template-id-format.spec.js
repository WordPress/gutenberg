/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Template ID Format', () => {
	let pageId;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyfive' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.deleteAllPages();
		const page = await requestUtils.createPage( {
			title: 'Privacy Policy',
			status: 'publish',
		} );
		pageId = page.id;
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.deleteAllPages();
		await requestUtils.activateTheme( 'twentytwentyone' );
		// Ensure experiment is disabled after test.
		await requestUtils.setGutenbergExperiments( [] );
	} );

	const testTemplateEditing = async (
		{ admin, editor, page, requestUtils },
		experiments,
		contentText
	) => {
		await requestUtils.setGutenbergExperiments( experiments );

		// Navigate directly to the page editor using the page ID.
		await admin.editPost( pageId );

		// Wait for the editor to be ready.
		await expect(
			page.locator( 'iframe[name="editor-canvas"]' )
		).toBeVisible();

		// Close pattern chooser dialog if visible.
		const patternDialog = page.getByRole( 'dialog', {
			name: 'Choose a pattern',
		} );
		await expect( patternDialog ).toBeVisible( { timeout: 2000 } );
		await patternDialog.getByRole( 'button', { name: 'Close' } ).click();

		await editor.openDocumentSettingsSidebar();
		const settingsPanel = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settingsPanel.getByRole( 'tab', { name: 'Page' } ).click();
		await settingsPanel
			.getByRole( 'button', { name: 'Template options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Edit template' } ).click();
		await expect( editor.canvas.locator( 'body' ) ).toBeVisible();

		// Set preferences for the site editor context.
		await editor.setPreferences( 'core/edit-post', {
			welcomeGuideTemplate: false,
		} );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: contentText },
		} );
		await expect( editor.canvas.getByText( contentText ) ).toBeVisible();

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save' } )
			.click();

		await expect( page.locator( 'body' ) ).not.toContainText(
			'No templates exist with that id.'
		);
	};

	test( 'should open and edit templates correctly when active_templates experiment is enabled', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await testTemplateEditing(
			{ admin, editor, page, requestUtils },
			[ 'active_templates' ],
			'Test content with experiment enabled'
		);

		// Verify test completed successfully.
		expect( true ).toBe( true );
	} );

	test( 'should open and edit templates correctly when active_templates experiment is disabled', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await testTemplateEditing(
			{ admin, editor, page, requestUtils },
			[],
			'Test content with experiment disabled'
		);

		// Verify test completed successfully.
		expect( true ).toBe( true );
	} );
} );
