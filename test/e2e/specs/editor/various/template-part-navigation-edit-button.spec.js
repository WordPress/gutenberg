/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Template Part Navigation Edit Button', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyfive' );
		// Create some pages so the header template part has a page list
		await requestUtils.createPage( {
			title: 'Test Page 1',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Test Page 2',
			status: 'publish',
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		// Delete all the pages we created
		await requestUtils.deleteAllPages();
	} );

	test( 'should select navigation block in isolated editor when clicking Edit navigation button on a page ', async ( {
		admin,
		editor,
		page,
	} ) => {
		// Create and visit a page (not a template)
		await admin.createNewPost( { postType: 'page' } );

		// Close pattern chooser dialog
		const patternDialog = page.getByRole( 'dialog', {
			name: 'Choose a pattern',
		} );
		await expect( patternDialog ).toBeVisible();
		await patternDialog.getByRole( 'button', { name: 'Close' } ).click();

		// TODO: Turn on the "Show template parts" switch in the

		const viewButton = page.getByRole( 'button', {
			name: 'View',
			exact: true,
		} );
		await expect( viewButton ).toBeVisible();
		await viewButton.click();

		const showTemplateOption = page.getByRole( 'menuitemcheckbox', {
			name: 'Show template',
		} );
		await expect( showTemplateOption ).toBeVisible();
		await showTemplateOption.click();

		const editNavigationButton = page.locator(
			'role=button[name="Edit navigation"]'
		);

		await test.step( 'should show Edit navigation button when template part has navigation block', async () => {
			// Find the header template part block
			const headerTemplatePart = editor.canvas.getByRole( 'document', {
				name: 'Block: Header',
			} );

			// Wait for it to be visible
			await expect( headerTemplatePart ).toBeVisible();

			// Click to select it
			await headerTemplatePart.click();

			// Verify the button is visible
			await expect( editNavigationButton ).toBeVisible();
		} );

		await test.step( 'clicking Edit navigation button should go to isolated editor', async () => {
			// Get the current URL before navigation
			await editNavigationButton.click();

			// Verify we navigated to the template part editor
			// If we went to the isolated editor, we should see the command palette button for the template part
			const commandPaletteButton = page.getByRole( 'button', {
				name: 'Header · Template Part ⌘K',
			} );
			await expect( commandPaletteButton ).toBeVisible();
		} );

		await test.step( 'The navigation block should be selected in the isolated editor', async () => {
			const navigationBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Navigation',
			} );

			await expect( navigationBlock ).toBeVisible();

			await expect( navigationBlock ).toHaveClass( /is-selected/ );
		} );
	} );
} );
