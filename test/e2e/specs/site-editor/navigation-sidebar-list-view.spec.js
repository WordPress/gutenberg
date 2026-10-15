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

	test.describe( 'nested appender', () => {
		const nestedMenuFixture = {
			title: 'Nested Menu',
			content: `<!-- wp:navigation-submenu {"label":"Top Level Item 1","type":"custom","url":"https://wordpress.org/1","kind":"custom"} -->
<!-- wp:navigation-link {"label":"Submenu Item","type":"custom","url":"https://wordpress.org/sub","kind":"custom"} /-->
<!-- wp:navigation-submenu {"label":"Nested Submenu","type":"custom","url":"https://wordpress.org/nested","kind":"custom"} -->
<!-- wp:navigation-link {"label":"Nested Item","type":"custom","url":"https://wordpress.org/nested-item","kind":"custom"} /-->
<!-- /wp:navigation-submenu -->
<!-- /wp:navigation-submenu -->
<!-- wp:navigation-link {"label":"Top Level Item 2","type":"custom","url":"https://wordpress.org/2","kind":"custom"} /-->`,
		};

		const openSidebarListView = async (
			{ admin, page, requestUtils },
			fixture
		) => {
			const menu = await requestUtils.createNavigationMenu( fixture );
			await admin.visitSiteEditor( {
				postId: menu?.id,
				postType: 'wp_navigation',
			} );
			const listView = page.getByRole( 'treegrid', {
				name: 'Block navigation structure',
			} );
			await expect(
				listView.getByRole( 'gridcell', {
					name: 'Top Level Item 2',
					exact: true,
				} )
			).toBeVisible();
			return listView;
		};

		// The nesting levels of the appender rows, top to bottom. The
		// top-level appender is always present, so `[ 1 ]` means no nested
		// appender is shown.
		const appenderLevels = ( listView ) =>
			listView
				.getByRole( 'row' )
				.filter( {
					has: listView
						.page()
						.getByRole( 'button', { name: /^Add / } ),
				} )
				.evaluateAll( ( rows ) =>
					rows.map( ( row ) =>
						Number( row.getAttribute( 'aria-level' ) )
					)
				);

		test( 'shows an appender for a submenu while it or one of its items is selected', async ( {
			admin,
			page,
			requestUtils,
			linkControl,
		} ) => {
			const listView = await openSidebarListView(
				{ admin, page, requestUtils },
				nestedMenuFixture
			);
			const item = ( name ) =>
				listView.getByRole( 'gridcell', { name, exact: true } );

			await expect
				.poll( () => appenderLevels( listView ) )
				.toEqual( [ 1 ] );

			await test.step( 'selecting the submenu shows its appender', async () => {
				await item( 'Top Level Item 1' ).click();
				await expect
					.poll( () => appenderLevels( listView ) )
					.toEqual( [ 2, 1 ] );
			} );

			await test.step( 'selecting an item in the submenu keeps it', async () => {
				await item( 'Submenu Item' ).click();
				await expect
					.poll( () => appenderLevels( listView ) )
					.toEqual( [ 2, 1 ] );
			} );

			await test.step( 'selecting a nested item shows one for each ancestor', async () => {
				await item( 'Nested Item' ).click();
				await expect
					.poll( () => appenderLevels( listView ) )
					.toEqual( [ 3, 2, 1 ] );
			} );

			await test.step( 'selecting a block outside the submenu hides them', async () => {
				await item( 'Top Level Item 2' ).click();
				await expect
					.poll( () => appenderLevels( listView ) )
					.toEqual( [ 1 ] );
			} );

			await test.step( 'a collapsed submenu shows no appender', async () => {
				// Clicking the row selects it and moves focus there, so the
				// arrow keys collapse and expand it.
				await item( 'Top Level Item 1' ).click();
				await page.keyboard.press( 'ArrowLeft' );
				await expect( item( 'Submenu Item' ) ).toBeHidden();
				await expect
					.poll( () => appenderLevels( listView ) )
					.toEqual( [ 1 ] );
				await page.keyboard.press( 'ArrowRight' );
				await expect( item( 'Submenu Item' ) ).toBeVisible();
				await expect
					.poll( () => appenderLevels( listView ) )
					.toEqual( [ 2, 1 ] );
			} );

			await test.step( 'the submenu appender adds a link inside the submenu', async () => {
				// The nested appender row comes before the top-level one.
				await listView
					.getByRole( 'button', { name: 'Add page' } )
					.first()
					.click();

				// The Link UI opens for the new item, as it does at the top level.
				await linkControl.useLinkControlSearch( 'Test Page 1' );

				await expect(
					item( 'Test Page 1' ).filter( {
						hasText: 'Block 3 of 3, Level 2.',
					} )
				).toBeVisible();
			} );
		} );

		test( 'adds a button from the appender of a Buttons block in the menu', async ( {
			admin,
			page,
			requestUtils,
		} ) => {
			const listView = await openSidebarListView(
				{ admin, page, requestUtils },
				{
					title: 'Buttons Menu',
					content: `<!-- wp:buttons --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button">First</a></div><!-- /wp:button --></div><!-- /wp:buttons -->
<!-- wp:navigation-link {"label":"Top Level Item 2","type":"custom","url":"https://wordpress.org/2","kind":"custom"} /-->`,
				}
			);

			await expect(
				listView.getByRole( 'button', { name: 'Add Button' } )
			).toBeHidden();

			await listView.getByRole( 'gridcell', { name: /^First/ } ).click();
			const appender = listView.getByRole( 'button', {
				name: 'Add Button',
			} );
			await expect( appender ).toBeVisible();
			await appender.click();

			// The new Button follows the first one inside the Buttons block.
			await expect(
				listView
					.getByRole( 'gridcell', { name: 'Button', exact: true } )
					.filter( {
						hasText: 'Block 2 of 2, Level 2.',
					} )
			).toBeVisible();
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
