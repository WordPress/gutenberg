/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Pages View Persistence', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		// Create some test pages
		await requestUtils.createPage( {
			title: 'Test Page 1',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Test Page 2',
			status: 'draft',
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deleteAllPages();
	} );

	test.beforeEach( async ( { admin, page } ) => {
		await admin.visitSiteEditor();
		await page.getByRole( 'button', { name: 'Pages' } ).click();

		// Check if view is modified by looking for the blue dot indicator
		const modifiedIndicator = page.locator(
			'.dataviews-view-config__modified-indicator'
		);
		if ( await modifiedIndicator.isVisible() ) {
			// Open dropdown and reset
			await page.getByRole( 'button', { name: 'View options' } ).click();
			await page.getByRole( 'button', { name: 'Reset view' } ).click();
			await expect( modifiedIndicator ).toBeHidden();
		}
	} );

	test( 'persists table layout across all tabs with unified view persistence', async ( {
		page,
	} ) => {
		// Change layout to table view
		await page.getByRole( 'button', { name: 'Layout' } ).click();
		await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();

		// Verify table is visible
		await expect( page.getByRole( 'table' ) ).toBeVisible();

		// Verify the modified indicator (blue dot) appears when view is modified
		const modifiedIndicator = page.locator(
			'.dataviews-view-config__modified-indicator'
		);
		await expect( modifiedIndicator ).toBeVisible();

		// Navigate to Drafts view
		await page
			.getByRole( 'button', {
				name: 'Drafts',
				exact: true,
			} )
			.click();

		// With unified persistence, Drafts tab should also show table layout
		// since all tabs share the same persisted view
		await expect( page.getByRole( 'table' ) ).toBeVisible();

		// Modified indicator should still be visible on Drafts tab
		await expect( modifiedIndicator ).toBeVisible();

		// Navigate back to All Pages
		await page
			.getByRole( 'button', {
				name: 'All Pages',
			} )
			.click();

		// Verify table layout persisted
		await expect( page.getByRole( 'table' ) ).toBeVisible();

		// Verify modified indicator is still visible
		await expect( modifiedIndicator ).toBeVisible();

		// Open dropdown and click the Reset button
		await page.getByRole( 'button', { name: 'View options' } ).click();
		const resetButton = page.getByRole( 'button', { name: 'Reset view' } );
		await expect( resetButton ).toBeEnabled();
		await resetButton.click();

		// Verify the modified indicator is hidden after reset
		await expect( modifiedIndicator ).toBeHidden();

		// Verify view returns to list layout
		await expect( page.getByRole( 'grid' ) ).toBeVisible();

		// Verify canvas is still visible in list layout
		await expect(
			page.getByRole( 'region', { name: 'Editor content' } )
		).toBeVisible();
	} );
} );
