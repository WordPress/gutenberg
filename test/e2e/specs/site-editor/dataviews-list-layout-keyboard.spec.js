/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Dataviews List Layout', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// Activate a theme with permissions to access the site editor.
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.createPage( {
			title: 'Privacy Policy',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Sample Page',
			status: 'publish',
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		// Go back to the default theme.
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
			requestUtils.deleteAllPages(),
		] );
	} );

	test.beforeEach( async ( { admin, page } ) => {
		// Go to the pages page, as it has the list layout enabled by default.
		await admin.visitSiteEditor();
		await page.getByRole( 'button', { name: 'Pages' } ).click();
	} );

	test( 'Items list is reachable via TAB', async ( { page } ) => {
		// Start the sequence on the search component.
		await page.getByRole( 'searchbox', { name: 'Search' } ).click();

		// Tab until reaching the items list.
		await page.keyboard.press( 'Tab' );
		await expect(
			page.getByRole( 'button', { name: 'Add filter' } )
		).toBeFocused();

		await page.keyboard.press( 'Tab' );
		await expect(
			page.getByRole( 'button', { name: 'Layout' } )
		).toBeFocused();

		await page.keyboard.press( 'Tab' );
		await expect(
			page.getByRole( 'button', { name: 'View options' } )
		).toBeFocused();

		// Make sure the items have loaded before reaching for the 1st item in the list.
		await expect( page.getByRole( 'grid' ) ).toBeVisible();
		await page.keyboard.press( 'Tab' );
		await expect(
			page.getByRole( 'grid' ).getByRole( 'button' ).first()
		).toBeFocused();
	} );

	test( 'Navigates from items list to preview via TAB, and vice versa', async ( {
		page,
	} ) => {
		// Start the sequence on the search component.
		await page.getByRole( 'searchbox', { name: 'Search' } ).click();

		// Tab until reaching the items list.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );

		// Make sure the items have loaded before reaching for the 1st item in the list.
		await expect( page.getByRole( 'grid' ) ).toBeVisible();
		await page.keyboard.press( 'Tab' );
		await expect( page.getByLabel( 'Privacy Policy' ) ).toBeFocused();

		// Go to the preview.
		await page.keyboard.press( 'Tab' );
		await expect(
			page
				.getByRole( 'region', { name: 'Editor content' } )
				.getByRole( 'button', { name: 'Edit' } )
		).toBeFocused();

		// Go back to the items list using SHIFT+TAB.
		await page.keyboard.press( 'Shift+Tab' );
		await expect( page.getByLabel( 'Privacy Policy' ) ).toBeFocused();
	} );

	test( 'Navigates the items list via UP/DOWN arrow keys', async ( {
		page,
	} ) => {
		// Start the sequence on the search component.
		await page.getByRole( 'searchbox', { name: 'Search' } ).click();

		// Tab until reaching the items list.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );

		// Make sure the items have loaded before reaching for the 1st item in the list.
		await expect( page.getByRole( 'grid' ) ).toBeVisible();
		await page.keyboard.press( 'Tab' );

		// Use arrow up/down to move through the list.
		await page.keyboard.press( 'ArrowDown' );
		await expect( page.getByLabel( 'Sample Page' ) ).toBeFocused();

		await page.keyboard.press( 'ArrowUp' );
		await expect( page.getByLabel( 'Privacy Policy' ) ).toBeFocused();
	} );

	test( 'Actions are reachable via RIGHT/LEFT arrow keys', async ( {
		page,
	} ) => {
		// Start the sequence on the search component.
		await page.getByRole( 'searchbox', { name: 'Search' } ).click();

		// Tab until reaching the items list.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );

		// Make sure the items have loaded before reaching for the 1st item in the list.
		await expect( page.getByRole( 'grid' ) ).toBeVisible();
		await page.keyboard.press( 'Tab' );

		// Use right/left arrow keys to move horizontally.
		await page.keyboard.press( 'ArrowRight' );
		await expect(
			page
				.getByRole( 'row', { name: 'Privacy Policy Edit Actions' } )
				.getByLabel( 'Edit' )
		).toBeFocused();

		await page.keyboard.press( 'ArrowRight' );
		await expect(
			page
				.getByRole( 'row', { name: 'Privacy Policy Edit Actions' } )
				.getByLabel( 'Actions' )
		).toBeFocused();

		await page.keyboard.press( 'ArrowLeft' );
		await expect(
			page
				.getByRole( 'row', { name: 'Privacy Policy Edit Actions' } )
				.getByLabel( 'Edit' )
		).toBeFocused();

		await page.keyboard.press( 'ArrowLeft' );
		await expect( page.getByLabel( 'Privacy Policy' ) ).toBeFocused();
	} );

	test( 'Navigates the list via UP/DOWN arrow keys from action buttons', async ( {
		page,
	} ) => {
		// Start the sequence on the search component.
		await page.getByRole( 'searchbox', { name: 'Search' } ).click();

		// Tab until reaching the items list.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );

		// Make sure the items have loaded before reaching for the 1st item in the list.
		await expect( page.getByRole( 'grid' ) ).toBeVisible();
		await page.keyboard.press( 'Tab' );

		// Use arrow up/down to move through the list from the edit primary action button.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowDown' );
		await expect(
			page
				.getByRole( 'row', { name: 'Sample Page Edit Actions' } )
				.getByLabel( 'Edit' )
		).toBeFocused();

		await page.keyboard.press( 'ArrowUp' );
		await expect(
			page
				.getByRole( 'row', { name: 'Privacy Policy Edit Actions' } )
				.getByLabel( 'Edit' )
		).toBeFocused();

		// Use arrow up/down to move through the list from the all actions button.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowDown' );
		await expect(
			page
				.getByRole( 'row', { name: 'Sample Page Edit Actions' } )
				.getByLabel( 'Actions' )
		).toBeFocused();

		await page.keyboard.press( 'ArrowUp' );
		await expect(
			page
				.getByRole( 'row', { name: 'Privacy Policy Edit Actions' } )
				.getByLabel( 'Actions' )
		).toBeFocused();
	} );
} );
