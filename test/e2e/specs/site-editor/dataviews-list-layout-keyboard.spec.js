/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Dataviews List Layout', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// Activate a theme with permissions to access the site editor.
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.createPage( {
			title: 'Page One',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Page Two',
			status: 'publish',
		} );
	} );

	test.beforeEach( async ( { admin, page } ) => {
		// Go to the pages page, as it has the list layout enabled by default.
		await admin.visitSiteEditor();
		await page.getByRole( 'button', { name: 'Pages' } ).click();

		// Wait for the pages dataviews UI to fully load including:
		// - the "Add filter" button, enabled only after post type fields are loaded
		// - the actual pages in the list, appearing after a REST fetch finishes
		// Only then we can start testing keyboard navigation around the full UI.
		await expect(
			page.getByRole( 'button', { name: 'Add filter' } )
		).toBeVisible();
		await expect( page.getByRole( 'grid' ) ).toBeVisible();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		// Go back to the default theme.
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
			requestUtils.deleteAllPages(),
		] );
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

		const firstItem = page
			.getByRole( 'grid' )
			.getByRole( 'button' )
			.first();

		await page.keyboard.press( 'Tab' );
		await expect( firstItem ).toBeFocused();

		// Go to the preview.
		await page.keyboard.press( 'Tab' );
		await expect(
			page
				.getByRole( 'region', { name: 'Editor content' } )
				.getByRole( 'button', { name: 'Edit' } )
		).toBeFocused();

		// Go back to the items list using SHIFT+TAB.
		await page.keyboard.press( 'Shift+Tab' );
		await expect( firstItem ).toBeFocused();
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
		await page.keyboard.press( 'Tab' );

		// Use arrow up/down to move through the list.
		await page.keyboard.press( 'ArrowDown' );
		await expect( page.getByLabel( 'Page Two' ) ).toBeFocused();

		await page.keyboard.press( 'ArrowUp' );
		await expect( page.getByLabel( 'Page One' ) ).toBeFocused();
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
		await page.keyboard.press( 'Tab' );

		// Use right/left arrow keys to move horizontally.
		await page.keyboard.press( 'ArrowRight' );
		await expect(
			page
				.getByRole( 'row', { name: 'Page One Edit Actions' } )
				.getByRole( 'button', { name: 'Edit' } )
		).toBeFocused();

		await page.keyboard.press( 'ArrowRight' );
		await expect(
			page
				.getByRole( 'row', { name: 'Page One Edit Actions' } )
				.getByLabel( 'Actions' )
		).toBeFocused();

		await page.keyboard.press( 'ArrowLeft' );
		await expect(
			page
				.getByRole( 'row', { name: 'Page One Edit Actions' } )
				.getByRole( 'button', { name: 'Edit' } )
		).toBeFocused();

		await page.keyboard.press( 'ArrowLeft' );
		await expect( page.getByLabel( 'Page One' ) ).toBeFocused();
	} );

	test( 'Search input retains focus while typing', async ( { page } ) => {
		const searchBox = page.getByRole( 'searchbox', { name: 'Search' } );
		const grid = page.getByRole( 'grid' );

		// Wait for Ariakit to auto-activate the first composite item.
		await expect( grid.locator( '[data-active-item]' ) ).toBeVisible();

		// Determine which item is active so we can search for the other one,
		// forcing the active item to be filtered out of the list.
		const activeRow = grid.locator(
			'[role="row"]:has([data-active-item])'
		);
		const activeRowText = await activeRow.textContent();
		const searchTerm = activeRowText.includes( 'One' ) ? 'Two' : 'One';

		// Type a query that filters out the auto-activated item.
		await searchBox.click();
		await searchBox.fill( searchTerm );

		// Wait for the debounced search to filter the list.
		await expect( grid.getByRole( 'row' ) ).toHaveCount( 1 );

		// Focus should still be on the search input, not stolen by the list.
		await expect( searchBox ).toBeFocused();
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
		await page.keyboard.press( 'Tab' );

		// Use arrow up/down to move through the list from the edit primary action button.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowDown' );
		await expect(
			page
				.getByRole( 'row', { name: 'Page Two Edit Actions' } )
				.getByRole( 'button', { name: 'Edit' } )
		).toBeFocused();

		await page.keyboard.press( 'ArrowUp' );
		await expect(
			page
				.getByRole( 'row', { name: 'Page One Edit Actions' } )
				.getByRole( 'button', { name: 'Edit' } )
		).toBeFocused();

		// Use arrow up/down to move through the list from the all actions button.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowDown' );
		await expect(
			page
				.getByRole( 'row', { name: 'Page Two Edit Actions' } )
				.getByLabel( 'Actions' )
		).toBeFocused();

		await page.keyboard.press( 'ArrowUp' );
		await expect(
			page
				.getByRole( 'row', { name: 'Page One Edit Actions' } )
				.getByLabel( 'Actions' )
		).toBeFocused();
	} );
} );
