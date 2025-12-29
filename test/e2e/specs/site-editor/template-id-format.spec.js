/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function navigateToTemplateEditor( { admin, editor, page }, pageId ) {
	await test.step( 'navigate to template editor', async () => {
		await admin.editPost( pageId );
		await expect(
			page.locator( 'iframe[name="editor-canvas"]' )
		).toBeVisible();

		// Close pattern chooser dialog.
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

		await editor.setPreferences( 'core/edit-post', {
			welcomeGuideTemplate: false,
		} );
	} );
}

async function saveEntities( { page } ) {
	await test.step( 'save entities', async () => {
		const publishSaveButton = page
			.getByRole( 'region', { name: 'Editor publish' } )
			.getByRole( 'button', { name: 'Save', exact: true } );
		const topBarSaveButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save', exact: true } );
		// Initiate save.
		await topBarSaveButton.click();
		const publishPanelVisible = await publishSaveButton.isVisible();
		// If the publish panel is visible, click the save button there.
		// Sometimes template parts trigger the publish panel to appear due to navigation fallback.
		if ( publishPanelVisible ) {
			await publishSaveButton.click();
		}

		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.getByText( /(updated|published)\./ )
				.first()
		).toBeVisible();
	} );
}

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

	test( 'should open and edit templates correctly when active_templates experiment is enabled', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const contentText = 'Test content with experiment enabled';
		await requestUtils.setGutenbergExperiments( [ 'active_templates' ] );
		await navigateToTemplateEditor( { admin, editor, page }, pageId );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: contentText },
		} );
		await expect( editor.canvas.getByText( contentText ) ).toBeVisible();

		await saveEntities( { page } );
		await navigateToTemplateEditor( { admin, editor, page }, pageId );

		// Make a second edit to the template to ensure wp_id is not 0.
		const secondEditText = `Second edit: ${ contentText }`;
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: secondEditText },
		} );
		await expect( editor.canvas.getByText( secondEditText ) ).toBeVisible();

		await saveEntities( { page } );
	} );

	test( 'should open and edit templates correctly when active_templates experiment is disabled', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const contentText = 'Test content with experiment disabled';
		await requestUtils.setGutenbergExperiments( [] );
		await navigateToTemplateEditor( { admin, editor, page }, pageId );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: contentText },
		} );
		await expect( editor.canvas.getByText( contentText ) ).toBeVisible();

		await saveEntities( { page } );
		await navigateToTemplateEditor( { admin, editor, page }, pageId );

		// Make a second edit to the template to ensure wp_id is not 0.
		const secondEditText = `Second edit: ${ contentText }`;
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: secondEditText },
		} );
		await expect( editor.canvas.getByText( secondEditText ) ).toBeVisible();

		await saveEntities( { page } );
	} );
} );
