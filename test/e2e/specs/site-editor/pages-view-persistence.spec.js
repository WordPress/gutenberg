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

		const resetButton = page.getByRole( 'button', { name: 'Reset view' } );
		if ( await resetButton.isVisible() ) {
			await resetButton.click();
			await expect( resetButton ).toBeHidden();
		}
	} );

	test( 'persists table layout and shows reset button across navigation', async ( {
		page,
	} ) => {
		// Change layout to table view
		await page.getByRole( 'button', { name: 'Layout' } ).click();
		await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();

		// Verify table is visible
		await expect( page.getByRole( 'table' ) ).toBeVisible();

		// Verify the Reset button appears when view is modified
		const resetButton = page.getByRole( 'button', { name: 'Reset view' } );
		await expect( resetButton ).toBeVisible();
		await expect( resetButton ).toBeEnabled();

		// Navigate to Drafts view
		await page
			.getByRole( 'button', {
				name: 'Drafts',
				exact: true,
			} )
			.click();

		// On Drafts view, we should be back to default view (list)
		// and Reset button should not be visible/enabled for modifications
		await expect( page.getByRole( 'grid' ) ).toBeVisible();
		await expect( resetButton ).toBeHidden();
		// Verify canvas (preview) is visible in list layout
		await expect(
			page.getByRole( 'region', { name: 'Editor content' } )
		).toBeVisible();

		// Navigate back to All Pages
		await page
			.getByRole( 'button', {
				name: 'All Pages',
			} )
			.click();

		// Verify table layout persisted
		await expect( page.getByRole( 'table' ) ).toBeVisible();

		// Verify Reset button is still visible
		await expect( resetButton ).toBeVisible();
		await expect( resetButton ).toBeEnabled();

		// Click the Reset button
		await resetButton.click();

		// wait for the reset button to be hidden
		await expect( resetButton ).toBeHidden();

		// Verify view returns to list layout
		await expect( page.getByRole( 'grid' ) ).toBeVisible();

		// Verify canvas is still visible in list layout
		await expect(
			page.getByRole( 'region', { name: 'Editor content' } )
		).toBeVisible();
	} );
} );
