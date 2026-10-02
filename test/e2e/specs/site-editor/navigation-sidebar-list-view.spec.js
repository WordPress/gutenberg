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

	test( 'can use appender in site editor sidebar list view', async ( {
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
			listView.getByRole( 'link', { name: 'Existing Item' } )
		).toBeVisible();

		// The appender button should be present to allow adding new items.
		const appender = listView.getByRole( 'button', { name: 'Add page' } );
		await expect( appender ).toBeVisible();

		const linkControlSearch = linkControl.getLinkControlSearch();

		await test.step( 'can add new menu items', async () => {
			await appender.click();

			// The LinkUI popover should open and immediately focus the search input.
			await expect( linkControlSearch ).toBeFocused();

			// Search for and select the page.
			await linkControl.useLinkControlSearch( 'Test Page 2' );

			// The new item should be appended after the existing item.
			await expect(
				listView.getByRole( 'link', { name: 'Test Page 2' } )
			).toBeVisible();
		} );

		await test.step( 'can open and close the Link UI without losing focus', async () => {
			await page.keyboard.press( 'ArrowDown' );
			await expect( appender ).toBeFocused();
			await page.keyboard.press( 'Enter' );
			await expect( linkControlSearch ).toBeFocused();
			await page.keyboard.press( 'Escape' );
			await expect( linkControlSearch ).toBeHidden();
		} );

		await test.step( 'can create a new page', async () => {
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
				listView.getByRole( 'link', { name: 'Brand New Page' } )
			).toBeVisible();
		} );
	} );

	test.describe( 'link settings popover', () => {
		const navMenuWithSubmenuFixture = {
			title: 'Test Navigation Menu',
			content:
				'<!-- wp:navigation-link {"label":"Existing Item","type":"custom","url":"http://www.wordpress.org/","kind":"custom"} /-->' +
				'<!-- wp:navigation-submenu {"label":"Submenu Item","type":"custom","url":"http://www.wordpress.org/submenu/","kind":"custom"} -->' +
				'<!-- wp:navigation-link {"label":"Child Item","type":"custom","url":"http://www.wordpress.org/child/","kind":"custom"} /-->' +
				'<!-- /wp:navigation-submenu -->',
		};

		test.beforeEach( async ( { admin, requestUtils } ) => {
			const createdMenu = await requestUtils.createNavigationMenu(
				navMenuWithSubmenuFixture
			);

			await admin.visitSiteEditor( {
				postId: createdMenu?.id,
				postType: 'wp_navigation',
			} );
		} );

		test( 'opens when selecting a link in the list view', async ( {
			page,
		} ) => {
			const listView = page.getByRole( 'treegrid', {
				name: 'Block navigation structure',
			} );

			await listView
				.getByRole( 'link', { name: 'Existing Item' } )
				.click();

			await expect(
				page.getByRole( 'heading', { name: 'Settings' } )
			).toBeVisible();
			await expect(
				page.getByRole( 'textbox', { name: 'Text' } )
			).toHaveValue( 'Existing Item' );
			await expect(
				page.getByRole( 'checkbox', { name: 'Open in new tab' } )
			).toBeVisible();
		} );

		test( 'can edit a link label', async ( { page } ) => {
			const listView = page.getByRole( 'treegrid', {
				name: 'Block navigation structure',
			} );

			await listView
				.getByRole( 'link', { name: 'Existing Item' } )
				.click();

			const labelInput = page.getByRole( 'textbox', { name: 'Text' } );
			await labelInput.fill( 'Changed Label' );

			await expect(
				listView.getByRole( 'link', { name: 'Changed Label' } )
			).toBeVisible();
			await expect(
				listView.getByRole( 'link', { name: 'Existing Item' } )
			).toBeHidden();
		} );

		test( 'opens from the options menu', async ( { page } ) => {
			const listView = page.getByRole( 'treegrid', {
				name: 'Block navigation structure',
			} );
			const row = listView.getByRole( 'row' ).filter( {
				has: page.getByRole( 'link', { name: 'Existing Item' } ),
			} );

			await row.getByRole( 'button', { name: 'Options' } ).click();
			await page.getByRole( 'menuitem', { name: 'Edit' } ).click();

			await expect(
				page.getByRole( 'textbox', { name: 'Text' } )
			).toHaveValue( 'Existing Item' );
		} );

		test( 'can edit a submenu label', async ( { page } ) => {
			const listView = page.getByRole( 'treegrid', {
				name: 'Block navigation structure',
			} );

			await listView
				.getByRole( 'link', { name: 'Submenu Item' } )
				.click();

			const labelInput = page.getByRole( 'textbox', { name: 'Text' } );
			await expect( labelInput ).toHaveValue( 'Submenu Item' );
			await labelInput.fill( 'Changed Submenu' );

			await expect(
				listView.getByRole( 'link', { name: 'Changed Submenu' } )
			).toBeVisible();
		} );

		test( 'closes with Escape and returns focus to the list view item', async ( {
			page,
		} ) => {
			const listView = page.getByRole( 'treegrid', {
				name: 'Block navigation structure',
			} );
			const item = listView.getByRole( 'link', {
				name: 'Existing Item',
			} );

			await item.click();

			const labelInput = page.getByRole( 'textbox', { name: 'Text' } );
			await labelInput.focus();
			await page.keyboard.press( 'Escape' );

			await expect( labelInput ).toBeHidden();
			await expect( item ).toBeFocused();
		} );
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

		const searchResults = this.page.getByRole( 'listbox', {
			name: 'Search results',
		} );
		await expect( searchResults ).toBeVisible();

		// Click the matching result directly rather than pressing ArrowDown +
		// Enter. The search is debounced, so the top result can still be a
		// stale suggestion when the list first appears, and Enter would
		// select it.
		await searchResults.getByRole( 'option', { name: searchTerm } ).click();
	}
}
