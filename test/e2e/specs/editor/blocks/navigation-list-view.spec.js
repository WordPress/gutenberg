/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Navigation block - List view editing', () => {
	const navMenuBlocksFixture = {
		title: 'Test Menu',
		content: `<!-- wp:navigation-link {"label":"Top Level Item 1","type":"page","id":250,"url":"http://localhost:8888/quod-error-esse-nemo-corporis-rerum-repellendus/","kind":"post-type"} /-->
        <!-- wp:navigation-submenu {"label":"Top Level Item 2","type":"page","id":250,"url":"http://localhost:8888/quod-error-esse-nemo-corporis-rerum-repellendus/","kind":"post-type"} -->
            <!-- wp:navigation-link {"label":"Test Submenu Item","type":"page","id":270,"url":"http://localhost:8888/et-aspernatur-recusandae-non-sint/","kind":"post-type"} /-->
        <!-- /wp:navigation-submenu -->`,
	};

	test.beforeAll( async ( { requestUtils } ) => {
		// We need pages to be published so the Link Control can return pages
		await requestUtils.createPage( {
			title: 'Test Page 1',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Test Page 2',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Test Page 3',
			status: 'publish',
		} );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test.use( {
		linkControl: async ( { page }, use ) => {
			await use( new LinkControl( { page } ) );
		},
	} );

	test( 'show a list view in the inspector controls', async ( {
		page,
		editor,
		requestUtils,
	} ) => {
		await requestUtils.createNavigationMenu( navMenuBlocksFixture );

		await editor.insertBlock( { name: 'core/navigation' } );

		await editor.openDocumentSettingsSidebar();

		await expect(
			page.getByRole( 'tab', {
				name: 'List View',
			} )
		).toBeVisible();

		const listViewPanel = page.getByRole( 'tabpanel', {
			name: 'List View',
		} );

		await expect( listViewPanel ).toBeVisible();

		await expect(
			listViewPanel.getByRole( 'heading', {
				name: 'Menu',
			} )
		).toBeVisible();

		await expect(
			listViewPanel.getByRole( 'treegrid', {
				name: 'Block navigation structure',
				description: 'Structure for navigation menu: Test Menu',
			} )
		).toBeVisible();
	} );

	test( `list view should correctly reflect navigation items' structure`, async ( {
		page,
		editor,
		requestUtils,
	} ) => {
		await requestUtils.createNavigationMenu( navMenuBlocksFixture );

		await editor.insertBlock( { name: 'core/navigation' } );

		await editor.openDocumentSettingsSidebar();

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
			description: 'Structure for navigation menu: Test Menu',
		} );

		// Check the structure of the individual menu items matches the one that was created.
		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'Page Link',
				} )
				.filter( {
					hasText: 'Block 1 of 2, Level 1', // proxy for filtering by description.
				} )
				.getByText( 'Top Level Item 1' )
		).toBeVisible();

		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'Submenu',
				} )
				.filter( {
					hasText: 'Block 2 of 2, Level 1', // proxy for filtering by description.
				} )
				.getByText( 'Top Level Item 2' )
		).toBeVisible();

		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'Page Link',
				} )
				.filter( {
					hasText: 'Block 1 of 1, Level 2', // proxy for filtering by description.
				} )
				.getByText( 'Test Submenu Item' )
		).toBeVisible();
	} );

	test( `can add new menu items`, async ( {
		page,
		editor,
		requestUtils,
		linkControl,
	} ) => {
		const { id: menuId } =
			await requestUtils.createNavigationMenu( navMenuBlocksFixture );

		// Insert x2 blocks as a stress test as several bugs have been found with inserting
		// blocks into the navigation block when there are multiple blocks referencing the
		// **same** menu.
		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: {
				ref: menuId,
			},
		} );
		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: {
				ref: menuId,
			},
		} );

		await editor.openDocumentSettingsSidebar();

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
			description: 'Structure for navigation menu: Test Menu',
		} );

		const appender = listView.getByRole( 'button', {
			name: 'Add block',
		} );

		await expect( appender ).toBeVisible();

		await appender.click();

		// Expect to see the block inserter.
		await expect(
			page.getByRole( 'searchbox', {
				name: 'Search for blocks and patterns',
			} )
		).toBeFocused();

		const blockResults = page.getByRole( 'listbox', {
			name: 'Blocks',
		} );

		await expect( blockResults ).toBeVisible();

		const blockResultOptions = blockResults.getByRole( 'option' );

		// Expect to see the Page Link and Custom Link blocks as the nth(0) and nth(1) results.
		// This is important for usability as the Page Link block is the most likely to be used.
		await expect( blockResultOptions.nth( 0 ) ).toHaveText( 'Page Link' );
		await expect( blockResultOptions.nth( 1 ) ).toHaveText( 'Custom Link' );

		// Select the Page Link option.
		const pageLinkResult = blockResultOptions.nth( 0 );
		await pageLinkResult.click();

		// Expect to see the Link creation UI be focused.
		const linkUIInput = linkControl.getSearchInput();

		// Coverage for bug whereby Link UI input would be incorrectly prepopulated.
		// It should:
		// - be focused - should not be in "preview" mode but rather ready to accept input.
		// - be empty - not pre-populated
		// See: https://github.com/WordPress/gutenberg/issues/50733
		await expect( linkUIInput ).toBeFocused();
		await expect( linkUIInput ).toBeEmpty();

		const firstResult = await linkControl.getNthSearchResult( 0 );

		// Grab the text from the first result so we can check (later on) that it was inserted.
		const firstResultText =
			await linkControl.getSearchResultText( firstResult );

		// Create the link.
		await firstResult.click();

		// Check the new menu item was inserted at the end of the existing menu.
		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'Page Link',
				} )
				.filter( {
					hasText: 'Block 3 of 3, Level 1', // proxy for filtering by description.
				} )
				.getByText( firstResultText )
		).toBeVisible();
	} );

	test( `can remove menu items`, async ( { page, editor, requestUtils } ) => {
		await requestUtils.createNavigationMenu( navMenuBlocksFixture );

		await editor.insertBlock( { name: 'core/navigation' } );

		await editor.openDocumentSettingsSidebar();

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
			description: 'Structure for navigation menu: Test Menu',
		} );

		const submenuOptions = listView.getByRole( 'button', {
			name: 'Options for Submenu',
		} );

		// Open the options menu.
		await submenuOptions.click();

		// usage of `page` is required because the options menu is rendered into a slot
		// outside of the treegrid.
		const removeBlockOption = page
			.getByRole( 'menu', {
				name: 'Options for Submenu',
			} )
			.getByRole( 'menuitem', {
				name: 'Remove Top Level Item 2',
			} );

		await removeBlockOption.click();

		// Check the menu item was removed.
		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'Submenu',
				} )
				.filter( {
					hasText: 'Block 2 of 2, Level 1', // proxy for filtering by description.
				} )
				.getByText( 'Top Level Item 2' )
		).toBeHidden();
	} );

	test( `can edit menu items`, async ( { page, editor, requestUtils } ) => {
		await requestUtils.createNavigationMenu( navMenuBlocksFixture );

		await editor.insertBlock( { name: 'core/navigation' } );

		await editor.openDocumentSettingsSidebar();

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
			description: 'Structure for navigation menu: Test Menu',
		} );

		// Click on the first menu item to open its settings.
		const firstMenuItemAnchor = listView
			.getByRole( 'link', {
				name: 'Page',
				includeHidden: true,
			} )
			.getByText( 'Top Level Item 1' );
		await firstMenuItemAnchor.click();

		// Get the settings panel.
		const blockSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		await expect( blockSettings ).toBeVisible();

		await expect(
			blockSettings.getByRole( 'heading', {
				name: 'Page Link',
			} )
		).toBeVisible();

		await expect(
			blockSettings.getByRole( 'tab', {
				name: 'Settings',
				selected: true,
			} )
		).toBeVisible();

		await expect(
			blockSettings
				.getByRole( 'tabpanel', {
					name: 'Settings',
				} )
				.getByRole( 'heading', {
					name: 'Settings',
				} )
		).toBeVisible();

		const labelInput = blockSettings.getByRole( 'textbox', {
			name: 'Label',
		} );

		await expect( labelInput ).toHaveValue( 'Top Level Item 1' );

		await labelInput.focus();

		await page.keyboard.type( 'Changed label' );

		// Click the back button to go back to the Nav block.
		await blockSettings
			.getByRole( 'button', {
				name: 'Go to parent Navigation block',
			} )
			.click();

		// Check we're back on the Nav block list view.
		const listViewPanel = page.getByRole( 'tabpanel', {
			name: 'List View',
		} );

		await expect( listViewPanel ).toBeVisible();

		// Check the label was updated.
		await expect(
			listViewPanel
				.getByRole( 'gridcell', {
					name: 'Page Link',
				} )
				.filter( {
					hasText: 'Block 1 of 2, Level 1', // proxy for filtering by description.
				} )
				.getByText( 'Changed label' ) // new label text
		).toBeVisible();
	} );

	test( `can add submenus`, async ( {
		page,
		editor,
		requestUtils,
		linkControl,
	} ) => {
		await requestUtils.createNavigationMenu( navMenuBlocksFixture );

		await editor.insertBlock( { name: 'core/navigation' } );

		await editor.openDocumentSettingsSidebar();

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
			description: 'Structure for navigation menu: Test Menu',
		} );

		// click on options menu for the first menu item and select remove.
		const firstMenuItem = listView
			.getByRole( 'gridcell', {
				name: 'Page Link',
			} )
			.filter( {
				hasText: 'Block 1 of 2, Level 1', // proxy for filtering by description.
			} );

		// The options menu button is a sibling of the menu item gridcell.
		const firstItemOptions = firstMenuItem
			.locator( '..' ) // parent selector.
			.getByRole( 'button', {
				name: 'Options for Page Link',
			} );

		// Open the options menu.
		await firstItemOptions.click();

		// Add the submenu.
		// usage of `page` is required because the options menu is rendered into a slot
		// outside of the treegrid.
		const addSubmenuOption = page
			.getByRole( 'menu', {
				name: 'Options for Page Link',
			} )
			.getByRole( 'menuitem', {
				name: 'Add submenu',
			} );

		await addSubmenuOption.click();

		await linkControl.searchFor( 'https://wordpress.org' );

		await page.keyboard.press( 'Enter' );

		// Check the new item was inserted in the correct place.
		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'Custom Link',
				} )
				.filter( {
					hasText: 'Block 1 of 1, Level 2', // proxy for filtering by description.
				} )
				.getByText( 'wordpress.org' )
		).toBeVisible();

		// Check that the original item is still there but that it is now
		// a submenu item.
		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'Submenu',
				} )
				.filter( {
					hasText: 'Block 1 of 2, Level 1', // proxy for filtering by description.
				} )
				.getByText( 'Top Level Item 1' )
		).toBeVisible();
	} );

	test( `does not display link interface for blocks that have not just been inserted`, async ( {
		page,
		editor,
		requestUtils,
		linkControl,
	} ) => {
		// Provides coverage for a bug whereby the Link UI would be unexpectedly displayed for the last
		// inserted block even if the block had been deselected and then reselected.
		// See: https://github.com/WordPress/gutenberg/issues/50601

		const { id: menuId } =
			await requestUtils.createNavigationMenu( navMenuBlocksFixture );

		// Insert x2 blocks as a stress test as several bugs have been found with inserting
		// blocks into the navigation block when there are multiple blocks referencing the
		// **same** menu.
		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: {
				ref: menuId,
			},
		} );
		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: {
				ref: menuId,
			},
		} );

		await editor.openDocumentSettingsSidebar();

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
			description: 'Structure for navigation menu: Test Menu',
		} );

		await listView
			.getByRole( 'button', {
				name: 'Add block',
			} )
			.click();

		const blockResults = page.getByRole( 'listbox', {
			name: 'Blocks',
		} );

		await expect( blockResults ).toBeVisible();

		const blockResultOptions = blockResults.getByRole( 'option' );

		// Select the Page Link option.
		await blockResultOptions.nth( 0 ).click();

		// Immediately dismiss the Link UI thereby not populating the `url` attribute
		// of the block.
		await page.keyboard.press( 'Escape' );

		// Get the Inspector Tabs.
		const blockSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		// Trigger "unmount" of the List View.
		await blockSettings
			.getByRole( 'tab', {
				name: 'Settings',
			} )
			.click();

		// "Remount" the List View.
		// this is where the bug previously occurred.
		await blockSettings
			.getByRole( 'tab', {
				name: 'List View',
			} )
			.click();

		// Check that despite being the last inserted block, the Link UI is not displayed
		// in this scenario because it was not **just** inserted into the List View (i.e.
		// we have unmounted the list view and then remounted it).
		await expect( linkControl.getSearchInput() ).toBeHidden();
	} );
} );

class LinkControl {
	constructor( { page } ) {
		this.page = page;
	}

	getSearchInput() {
		return this.page.getByRole( 'combobox', {
			name: 'Link',
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

	async searchFor( searchTerm = 'https://wordpress.org' ) {
		const input = this.getSearchInput();

		await expect( input ).toBeFocused();

		await this.page.keyboard.type( searchTerm );

		await expect( input ).toHaveValue( searchTerm );

		return input;
	}

	async getSearchResultText( result ) {
		await expect( result ).toBeVisible();

		return result
			.locator( '.components-menu-item__item' ) // this is the only way to get the label text without the URL.
			.innerText();
	}
}
