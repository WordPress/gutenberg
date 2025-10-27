/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Templates', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
	} );
	test( 'Create a custom template', async ( { admin, page } ) => {
		const templateName = 'demo';
		await admin.visitSiteEditor();
		await page.getByRole( 'button', { name: 'Templates' } ).click();
		await page.getByRole( 'button', { name: 'Add template' } ).click();
		await page
			.getByRole( 'button', {
				name: 'A custom template can be manually applied to any post or page.',
			} )
			.click();
		// Fill the template title and submit.
		const newTemplateDialog = page.locator(
			'role=dialog[name="Create custom template"i]'
		);
		const templateNameInput = newTemplateDialog.locator(
			'role=textbox[name="Name"i]'
		);
		await templateNameInput.fill( templateName );
		await page.keyboard.press( 'Enter' );
		// Close the pattern suggestions dialog.
		await page
			.getByRole( 'dialog', { name: 'Choose a pattern' } )
			.getByRole( 'button', { name: 'Close' } )
			.click();
		await expect(
			page.locator(
				`role=button[name="Dismiss this notice"i] >> text="${ templateName }" successfully created.`
			)
		).toBeVisible();
	} );

	test( 'Persists filter/search when switching layout', async ( {
		page,
		admin,
	} ) => {
		await admin.visitSiteEditor();
		await page.getByRole( 'button', { name: 'Templates' } ).click();

		// Search templates
		await page.getByRole( 'searchbox', { name: 'Search' } ).fill( 'Index' );

		// Switch layout
		await page.getByRole( 'button', { name: 'Layout' } ).click();
		await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();

		// Confirm the table view is visible within Templates region
		const templatesRegion = page.locator( '[aria-label="Templates"]' );
		await expect( templatesRegion.getByRole( 'table' ) ).toContainText(
			'Index'
		);

		// The search should still contain the search term
		await expect(
			page.getByRole( 'searchbox', { name: 'Search' } )
		).toHaveValue( 'Index' );
	} );

	test( 'View persistence', async ( { page, admin, requestUtils } ) => {
		// Create additional templates for pagination testing
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'test-template-1',
			title: 'Test Template 1',
			content: 'test content 1',
		} );

		await test.step( 'Navigate to templates page', async () => {
			await admin.visitSiteEditor( { postType: 'wp_template' } );
			await expect(
				page.locator( '[aria-label="Templates"]' )
			).toBeVisible();
		} );

		await test.step( 'Can switch to Table view', async () => {
			// Switch to Table view
			await page.getByRole( 'button', { name: 'Layout' } ).click();
			await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();

			// Verify table view is active within Templates region
			const templatesRegion = page.locator( '[aria-label="Templates"]' );
			await expect( templatesRegion.getByRole( 'table' ) ).toBeVisible();
		} );

		await test.step( 'Verify Reset view button appears when switching from default view', async () => {
			await expect(
				page.getByRole( 'button', { name: 'Reset view' } )
			).toBeVisible();
		} );

		await test.step( 'Verify layout persists after page reload', async () => {
			// Reload the page
			await page.reload();

			// Wait for templates to be visible again
			const templatesRegion = page.locator( '[aria-label="Templates"]' );

			// Verify Table view persists within Templates region
			await expect( templatesRegion.getByRole( 'table' ) ).toBeVisible();

			// Reset view button should still be visible
			await expect(
				page.getByRole( 'button', { name: 'Reset view' } )
			).toBeVisible();
		} );

		await test.step( 'Verify search parameter appears in URL', async () => {
			// Search for a template
			await page
				.getByRole( 'searchbox', { name: 'Search' } )
				.fill( 'archive' );

			// Verify URL contains search parameter
			await expect( page ).toHaveURL( /search=archive/ );

			// Verify search persists after reload
			await page.reload();
			await expect(
				page.getByRole( 'searchbox', { name: 'Search' } )
			).toHaveValue( 'archive' );
		} );

		await test.step( 'Reset view returns to defaults', async () => {
			// Click Reset view button
			await page.getByRole( 'button', { name: 'Reset view' } ).click();

			// Grid view should be active (default) - verify table is hidden within Templates region
			const templatesRegion = page.locator( '[aria-label="Templates"]' );
			await expect( templatesRegion.getByRole( 'table' ) ).toBeHidden();

			// Reset view button should be hidden
			await expect(
				page.getByRole( 'button', { name: 'Reset view' } )
			).toBeHidden();

			// Verify Grid view is active
			await page.getByRole( 'button', { name: 'Layout' } ).click();
			await expect(
				page.getByRole( 'menuitemradio', { name: 'Grid' } )
			).toBeChecked();
		} );
	} );
} );
