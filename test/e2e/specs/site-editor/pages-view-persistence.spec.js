const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Whether the run targets the extensible site editor (v2). Both editors
// default the pages screen to the list layout; v2 renders its views as tabs
// where the classic editor uses sidebar buttons.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

// A layout that differs from the default one, to make the view modified.
const modifiedLayout = 'Table';
const modifiedLayoutRole = 'table';
const defaultLayoutRole = 'grid';

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

	test.beforeEach( async ( { admin, page } ) => {
		await admin.visitSiteEditor( { postType: 'page' } );

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

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deleteAllPages();
	} );

	test( 'persists table layout across all tabs with unified view persistence', async ( {
		page,
	} ) => {
		// Change layout to a non-default one
		await page.getByRole( 'button', { name: 'Layout' } ).click();
		await page
			.getByRole( 'menuitemradio', { name: modifiedLayout } )
			.click();

		// Verify the changed layout is visible
		await expect( page.getByRole( modifiedLayoutRole ) ).toBeVisible();

		// Verify the modified indicator (blue dot) appears when view is modified
		const modifiedIndicator = page.locator(
			'.dataviews-view-config__modified-indicator'
		);
		await expect( modifiedIndicator ).toBeVisible();

		// Navigate to Drafts view
		await ( isSiteEditorV2
			? page.getByRole( 'tab', { name: 'Drafts', exact: true } )
			: page.getByRole( 'button', { name: 'Drafts', exact: true } )
		).click();

		// With unified persistence, Drafts tab should also show the changed
		// layout since all tabs share the same persisted view
		await expect( page.getByRole( modifiedLayoutRole ) ).toBeVisible();

		// Modified indicator should still be visible on Drafts tab
		await expect( modifiedIndicator ).toBeVisible();

		// Navigate back to All Pages
		await ( isSiteEditorV2
			? page.getByRole( 'tab', { name: 'All Pages' } )
			: page.getByRole( 'button', { name: 'All Pages' } )
		).click();

		// Verify the changed layout persisted
		await expect( page.getByRole( modifiedLayoutRole ) ).toBeVisible();

		// Verify modified indicator is still visible
		await expect( modifiedIndicator ).toBeVisible();

		// Open dropdown and click the Reset button
		await page.getByRole( 'button', { name: 'View options' } ).click();
		const resetButton = page.getByRole( 'button', { name: 'Reset view' } );
		await expect( resetButton ).toBeEnabled();
		await resetButton.click();

		// Verify the modified indicator is hidden after reset
		await expect( modifiedIndicator ).toBeHidden();

		// Verify view returns to the default layout
		await expect( page.getByRole( defaultLayoutRole ) ).toBeVisible();

		// Verify the canvas is still visible in the default list layout.
		await expect(
			page.getByRole( 'region', { name: 'Editor content' } )
		).toBeVisible();
	} );
} );
