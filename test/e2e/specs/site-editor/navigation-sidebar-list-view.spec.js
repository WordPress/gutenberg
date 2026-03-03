/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Navigation sidebar - list view editing', () => {
	const navMenuFixture = {
		title: 'Test Navigation Menu',
		content:
			'<!-- wp:navigation-link {"label":"Existing Item","type":"custom","url":"http://www.wordpress.org/","kind":"custom"} /-->',
	};

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.createPage( {
			title: 'Test Page 1',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Test Page 2',
			status: 'publish',
		} );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMenus();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.activateTheme( 'twentytwentyone' ),
		] );
	} );

	test.use( {
		linkControl: async ( { page }, use ) => {
			await use( new LinkControl( { page } ) );
		},
	} );

	test( 'clicking an existing item opens the link editing popover and Escape returns focus', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const createdMenu =
			await requestUtils.createNavigationMenu( navMenuFixture );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		await expect( listView ).toBeVisible();

		// Click the existing navigation link in the list view.
		await listView
			.getByRole( 'gridcell', { name: 'Existing Item' } )
			.click();

		// The link editing controls popover should open.
		const editPopover = page.locator(
			'.edit-site-sidebar-navigation-screen-navigation-menus__link-editor'
		);
		await expect( editPopover ).toBeVisible();

		// Focus should be placed within the popover.
		const isFocusWithin = await editPopover.evaluate( ( el ) =>
			el.contains( document.activeElement )
		);
		expect( isFocusWithin ).toBe( true );

		// Press Escape to dismiss the popover.
		await page.keyboard.press( 'Escape' );

		// The popover should close.
		await expect( editPopover ).toBeHidden();

		// Focus should return to the clicked list item.
		await expect(
			listView
				.getByRole( 'gridcell', { name: 'Existing Item' } )
				.getByRole( 'link' )
		).toBeFocused();
	} );

	test( 'can add new menu items from the sidebar list view', async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu =
			await requestUtils.createNavigationMenu( navMenuFixture );

		// Visit the site editor in sidebar-browse mode (without canvas: 'edit')
		// so that the sidebar shows the navigation menu's list view.
		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		await expect( listView ).toBeVisible();

		// Verify the existing item is shown in the sidebar list view.
		await expect(
			listView.getByRole( 'gridcell', { name: 'Existing Item' } )
		).toBeVisible();

		// The appender button should be present to allow adding new items.
		// NOTE: This currently FAILS because NavigationMenuContent passes
		// showAppender={ false } to PrivateListView. Implementing the feature
		// requires changing it to showAppender={ true } and wiring up the
		// AdditionalBlockContent / LinkUI integration.
		const appender = listView.getByRole( 'button', { name: 'Add page' } );
		await expect( appender ).toBeVisible();

		await appender.click();

		// The LinkUI popover should open and immediately focus the search input.
		const linkUIInput = linkControl.getSearchInput();
		await expect( linkUIInput ).toBeFocused();
		await expect( linkUIInput ).toBeEmpty();

		// Type to trigger search suggestions.
		await linkControl.searchFor( 'Test Page' );

		// Select the first result to create a new menu item.
		const firstResult = await linkControl.getNthSearchResult( 0 );
		const firstResultText =
			await linkControl.getSearchResultText( firstResult );
		await firstResult.click();

		// The new item should be appended after the existing item.
		await expect(
			listView
				.getByRole( 'gridcell', { name: firstResultText } )
				.filter( { hasText: 'Block 2 of 2, Level 1.' } )
		).toBeVisible();
	} );

	test( 'opening the add link UI does not immediately trigger unsaved changes', async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu =
			await requestUtils.createNavigationMenu( navMenuFixture );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		await expect( listView ).toBeVisible();

		// Confirm no unsaved changes exist before interacting.
		await expect(
			page.getByRole( 'button', { name: /Review \d+ change/ } )
		).toBeHidden();

		const appender = listView.getByRole( 'button', { name: 'Add page' } );
		await appender.click();

		// Wait for the link UI to open so we know the click was processed
		// and state has settled — then assert no save indicator appeared.
		await expect( linkControl.getSearchInput() ).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: /Review \d+ change/ } )
		).toBeHidden();

		// Dismiss without selecting a URL.
		await page.keyboard.press( 'Escape' );

		// Wait for the link UI to fully close before checking — this ensures
		// the CSS visibility class has been removed and we are testing the
		// actual entity dirty state, not just the CSS mask.
		await expect( linkControl.getSearchInput() ).toBeHidden();

		// Verify the save indicator still does not appear — the empty block
		// insertion should be fully reverted, leaving the entity clean.
		await expect(
			page.getByRole( 'button', { name: /Review \d+ change…/ } )
		).toBeHidden();
	} );

	test( 'cancelling a second add does not remove previously added unsaved links', async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu =
			await requestUtils.createNavigationMenu( navMenuFixture );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		await expect( listView ).toBeVisible();

		// Add a first new item by selecting a URL.
		const appender = listView.getByRole( 'button', { name: 'Add page' } );
		await appender.click();
		await linkControl.searchFor( 'Test Page' );
		const firstResult = await linkControl.getNthSearchResult( 0 );
		const firstResultText =
			await linkControl.getSearchResultText( firstResult );
		await firstResult.click();

		// Verify the first new item was committed (block 2 of 2).
		await expect(
			listView
				.getByRole( 'gridcell', { name: firstResultText } )
				.filter( { hasText: 'Block 2 of 2, Level 1.' } )
		).toBeVisible();

		// Start adding a second item but cancel without selecting a URL.
		await appender.click();
		await expect( linkControl.getSearchInput() ).toBeFocused();
		await page.keyboard.press( 'Escape' );

		// Wait for the link UI to fully close.
		await expect( linkControl.getSearchInput() ).toBeHidden();

		// The previously committed unsaved link should still be present —
		// cancelling the second insertion must not remove the first one.
		await expect(
			listView
				.getByRole( 'gridcell', { name: 'Existing Item' } )
				.filter( { hasText: 'Block 1 of 2, Level 1.' } )
		).toBeVisible();
		await expect(
			listView
				.getByRole( 'gridcell', { name: firstResultText } )
				.filter( { hasText: 'Block 2 of 2, Level 1.' } )
		).toBeVisible();
	} );

	test( 'focus is managed correctly when dismissing the link UI without selecting a URL', async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu =
			await requestUtils.createNavigationMenu( navMenuFixture );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		await expect( listView ).toBeVisible();

		const appender = listView.getByRole( 'button', { name: 'Add page' } );
		await appender.click();

		// Verify focus goes to the search input immediately (focus management).
		await expect( linkControl.getSearchInput() ).toBeFocused();

		// Dismiss without selecting a URL.
		await page.keyboard.press( 'Escape' );

		// The auto-inserted empty block should be cleaned up automatically.
		// Verify the original item is still there and is the only item
		// (i.e. no orphaned empty block was left behind).
		await expect(
			listView
				.getByRole( 'gridcell', { name: 'Existing Item' } )
				.filter( { hasText: 'Block 1 of 1, Level 1.' } )
		).toBeVisible();
	} );
} );

class LinkControl {
	constructor( { page } ) {
		this.page = page;
	}

	getSearchInput() {
		return this.page.getByRole( 'combobox', {
			name: 'Search or type URL',
		} );
	}

	async getSearchResults() {
		const searchInput = this.getSearchInput();
		const resultsRef = await searchInput.getAttribute( 'aria-owns' );
		const linkUIResults = this.page.locator( `#${ resultsRef }` );
		await expect( linkUIResults ).toBeVisible();
		return linkUIResults.getByRole( 'option' );
	}

	async getNthSearchResult( index = 0 ) {
		const results = await this.getSearchResults();
		return results.nth( index );
	}

	async searchFor( searchTerm ) {
		const input = this.getSearchInput();
		await expect( input ).toBeFocused();
		await this.page.keyboard.type( searchTerm );
		await expect( input ).toHaveValue( searchTerm );
		return input;
	}

	async getSearchResultText( result ) {
		await expect( result ).toBeVisible();
		return result
			.locator( '.components-menu-item__item' )
			.last()
			.innerText();
	}
}
