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
		const appender = listView.getByRole( 'button', { name: 'Add page' } );
		await expect( appender ).toBeVisible();

		await appender.click();

		// The LinkUI popover should open and immediately focus the search input.
		await expect( linkControl.getLinkControlSearch() ).toBeFocused();

		// Search for and select the page.
		await linkControl.useLinkControlSearch( 'Test Page 2' );

		// The new item should be appended after the existing item.
		await expect(
			listView
				.getByRole( 'gridcell', { name: 'Test Page 2' } )
				.filter( { hasText: 'Block 2 of 2, Level 1.' } )
		).toBeVisible();
	} );

	test( 'can open and close the add link UI', async ( {
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

		await linkControl.addLinkClose();
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

		// Add a first new item by selecting a page.
		const appender = listView.getByRole( 'button', { name: 'Add page' } );
		await appender.click();
		await linkControl.useLinkControlSearch( 'Test Page 2' );

		// Verify the first new item was committed (block 2 of 2).
		await expect(
			listView
				.getByRole( 'gridcell', { name: 'Test Page 2' } )
				.filter( { hasText: 'Block 2 of 2, Level 1.' } )
		).toBeVisible();

		// Start adding a second item but cancel without selecting a URL.
		await appender.click();
		await linkControl.addLinkClose();

		// The previously committed unsaved link should still be present —
		// cancelling the second insertion must not remove the first one.
		await expect(
			listView
				.getByRole( 'gridcell', { name: 'Existing Item' } )
				.filter( { hasText: 'Block 1 of 2, Level 1.' } )
		).toBeVisible();
		await expect(
			listView
				.getByRole( 'gridcell', { name: 'Test Page 2' } )
				.filter( { hasText: 'Block 2 of 2, Level 1.' } )
		).toBeVisible();
	} );

	test( 'can create a new page from the sidebar list view appender', async ( {
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

		// The search input should be focused immediately.
		await expect( linkControl.getLinkControlSearch() ).toBeFocused();

		// Type a new page title that doesn't exist yet.
		await page.keyboard.type( 'Brand New Page', { delay: 50 } );

		// Tab twice to reach the "Create page" button.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );

		const createPageButton = page.getByRole( 'button', {
			name: 'Create page',
		} );
		await expect( createPageButton ).toBeVisible();
		await expect( createPageButton ).toBeFocused();

		// Open the page creation form.
		await page.keyboard.press( 'Enter' );

		// The title field should be pre-populated with the typed text.
		const titleField = page.getByRole( 'textbox', { name: 'Title' } );
		await expect( titleField ).toHaveValue( 'Brand New Page' );

		// The Back button should be focused after entering the creation form.
		const backButton = page.locator( '.link-ui-page-creator__back' );
		await expect( backButton ).toBeFocused();

		// Tab to the title field.
		await page.keyboard.press( 'Tab' );
		await expect( titleField ).toBeFocused();

		// Tab to the Publish checkbox (on by default).
		await page.keyboard.press( 'Tab' );
		const publishCheckbox = page.getByRole( 'checkbox', {
			name: 'Publish',
		} );
		await expect( publishCheckbox ).toBeFocused();
		await expect( publishCheckbox ).toBeChecked();

		// Tab twice more to reach the Create page button.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await expect( createPageButton ).toBeFocused();
		await page.keyboard.press( 'Enter' );

		// The newly created page should appear as a new item in the list view.
		await expect(
			listView
				.getByRole( 'gridcell', { name: 'Brand New Page' } )
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
		await expect( linkControl.getLinkControlSearch() ).toBeFocused();

		await linkControl.addLinkClose();

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

	getLinkControlSearch() {
		return this.page.getByRole( 'combobox', {
			name: 'Search or type URL',
		} );
	}

	async useLinkControlSearch( searchTerm ) {
		await expect( this.getLinkControlSearch() ).toBeFocused();

		await this.page.keyboard.type( searchTerm, { delay: 50 } );

		await expect(
			this.page.getByRole( 'listbox', { name: 'Search results' } )
		).toBeVisible();

		await this.page.keyboard.press( 'ArrowDown' );
		await this.page.keyboard.press( 'Enter' );
	}

	async addLinkClose() {
		await expect( this.getLinkControlSearch() ).toBeFocused();
		await this.page.keyboard.press( 'Escape' );
		await expect( this.getLinkControlSearch() ).toBeHidden();
	}
}
