const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Navigation block - List view editing', () => {
	// WordPress always has this category, so nothing needs creating or removing.
	const DEFAULT_CATEGORY_NAME = 'Uncategorized';

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
		await requestUtils.createPost( {
			title: 'Test Post 1',
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
					name: 'Top Level Item 1',
				} )
				.filter( {
					hasText: 'Block 1 of 2, Level 1.', // proxy for filtering by description.
				} )
		).toBeVisible();

		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'Top Level Item 2',
				} )
				.filter( {
					hasText: 'Block 2 of 2, Level 1.', // proxy for filtering by description.
				} )
		).toBeVisible();

		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'Test Submenu Item',
				} )
				.filter( {
					hasText: 'Block 1 of 1, Level 2.', // proxy for filtering by description.
				} )
		).toBeVisible();
	} );

	test( `can add new menu items`, async ( {
		page,
		pageUtils,
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
			name: 'Add page',
		} );

		await expect( appender ).toBeVisible();

		await appender.click();

		// Expect a Navigation Link block to be inserted
		// and immediately trigger its Link UI.
		const linkUIInput = linkControl.getSearchInput();

		// Coverage for bug whereby Link UI input would be incorrectly prepopulated.
		// It should:
		// - be focused - should not be in "preview" mode but rather ready to accept input.
		// - be empty - not pre-populated
		// See: https://github.com/WordPress/gutenberg/issues/50733
		await expect( linkUIInput ).toBeFocused();
		await expect( linkUIInput ).toBeEmpty();

		await test.step( 'default initial suggestions are all page type', async () => {
			// Provides test coverage for feature whereby Custom Link type
			// should default to `Pages` when displaying the "initial
			// suggestions" in the Link UI.
			// See https://github.com/WordPress/gutenberg/pull/54622.
			const firstResult = await linkControl.getNthSearchResult( 0 );
			const secondResult = await linkControl.getNthSearchResult( 1 );
			const thirdResult = await linkControl.getNthSearchResult( 2 );

			const firstResultType =
				await linkControl.getSearchResultType( firstResult );

			const secondResultType =
				await linkControl.getSearchResultType( secondResult );

			const thirdResultType =
				await linkControl.getSearchResultType( thirdResult );

			expect( firstResultType ).toBe( 'Page' );
			expect( secondResultType ).toBe( 'Page' );
			expect( thirdResultType ).toBe( 'Page' );
		} );

		await test.step( 'search from default link returns best page type matches first', async () => {
			// Search for a string that is the start of a page title
			await page.keyboard.type( 'Test', { delay: 50 } );

			const searchedResults = await linkControl.getSearchResults();

			// The initial suggestions are pages, so wait for a result that can only
			// come from the typed search before asserting on the order.
			await expect(
				searchedResults.filter( { hasText: 'Test Post 1' } )
			).toBeVisible();

			// The appended item is a Page Link, so first results should be pages
			const types = await Promise.all(
				[ 0, 1, 2 ].map( async ( index ) =>
					linkControl.getSearchResultType(
						await linkControl.getNthSearchResult( index )
					)
				)
			);
			expect( types ).toEqual( [ 'Page', 'Page', 'Page' ] );
		} );

		await test.step( 'can find taxonomy results via default link search', async () => {
			// Replace the search text with a category name.
			await pageUtils.pressKeys( 'primary+a' );
			await page.keyboard.type( DEFAULT_CATEGORY_NAME, { delay: 50 } );

			const searchedResults = await linkControl.getSearchResults();
			const categoryResult = searchedResults.filter( {
				hasText: DEFAULT_CATEGORY_NAME,
			} );

			await expect( categoryResult ).toBeVisible();

			// Nothing else on the site holds the word, so the term leads.
			expect(
				await linkControl.getSearchResultType( searchedResults.first() )
			).toBe( 'Category' );
		} );

		await test.step( 'can create a taxonomy result via default link search', async () => {
			// select it with the keyboard
			await pageUtils.pressKeys( 'ArrowDown' );

			const categoryResult = (
				await linkControl.getSearchResults()
			).filter( { hasText: DEFAULT_CATEGORY_NAME } );

			// URLInput is a combobox: focus stays on the input and the
			// highlighted option carries `aria-selected`.
			await expect( categoryResult ).toHaveAttribute(
				'aria-selected',
				'true'
			);

			// Submit the link.
			await pageUtils.pressKeys( 'Enter' );

			// Check the new menu item was inserted at the end of the existing menu.
			await expect(
				listView
					.getByRole( 'gridcell', {
						name: DEFAULT_CATEGORY_NAME,
					} )
					.filter( {
						hasText: 'Block 3 of 3, Level 1.', // proxy for filtering by description.
					} )
			).toBeVisible();
		} );
	} );

	// See https://github.com/WordPress/gutenberg/issues/76803.
	test( `can add a block from the link search results`, async ( {
		page,
		editor,
		requestUtils,
		linkControl,
	} ) => {
		const { id: menuId } =
			await requestUtils.createNavigationMenu( navMenuBlocksFixture );

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

		await listView.getByRole( 'button', { name: 'Add page' } ).click();

		await expect( linkControl.getSearchInput() ).toBeFocused();
		await page.keyboard.type( 'Home', { delay: 50 } );

		await page
			.getByRole( 'listbox', { name: /Search results/ } )
			.getByRole( 'option', { name: /Home Link/ } )
			.click();

		// The block takes the new link's place at the end of the menu. Being
		// the third of three shows the new link was not left behind.
		await expect(
			listView
				.getByRole( 'gridcell', { name: 'Home Link' } )
				.filter( { hasText: 'Block 3 of 3, Level 1.' } )
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

		const subMenuItem = listView
			.getByRole( 'gridcell', {
				name: 'Top Level Item 2',
			} )
			.filter( {
				hasText: 'Block 2 of 2, Level 1.', // proxy for filtering by description.
			} );

		// The options menu button is a sibling of the menu item gridcell.
		const subMenuItemActions = subMenuItem
			.locator( '..' ) // parent selector.
			.getByRole( 'button', {
				name: 'Options',
			} );

		// Open the actions menu.
		await subMenuItemActions.click();

		// usage of `page` is required because the options menu is rendered into a slot
		// outside of the treegrid.
		const removeBlockAction = page
			.getByRole( 'menu', {
				name: 'Options',
			} )
			.getByRole( 'menuitem', {
				name: 'Remove Top Level Item 2',
			} );

		await removeBlockAction.click();

		// Check the menu item was removed.
		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'Top Level Item 2',
				} )
				.filter( {
					hasText: 'Block 2 of 2, Level 1.', // proxy for filtering by description.
				} )
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
		const firstMenuItemAnchor = listView.getByRole( 'link', {
			name: 'Top Level Item 1',
		} );
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
				name: 'Content',
				selected: true,
			} )
		).toBeVisible();

		await expect(
			blockSettings
				.getByRole( 'tabpanel', {
					name: 'Content',
				} )
				.getByRole( 'heading', {
					name: 'Settings',
				} )
		).toBeVisible();

		const labelInput = blockSettings.getByRole( 'textbox', {
			name: 'Text',
		} );

		await expect( labelInput ).toHaveValue( 'Top Level Item 1' );

		await labelInput.focus();

		await page.keyboard.type( 'Changed label' );

		// Click the back button to go back to the Nav block.
		await blockSettings
			.getByRole( 'button', {
				name: 'Go to "Navigation" block',
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
					name: 'Changed label', // new menu item text
				} )
				.filter( {
					hasText: 'Block 1 of 2, Level 1.', // proxy for filtering by description.
				} )
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
				name: 'Top Level Item 1',
			} )
			.filter( {
				hasText: 'Block 1 of 2, Level 1.', // proxy for filtering by description.
			} );

		// The options menu button is a sibling of the menu item gridcell.
		const firstItemActions = firstMenuItem
			.locator( '..' ) // parent selector.
			.getByRole( 'button', {
				name: 'Options',
			} );

		// Open the actions menu.
		await firstItemActions.click();

		// Add the submenu.
		// usage of `page` is required because the options menu is rendered into a slot
		// outside of the treegrid.
		const addSubmenuAction = page
			.getByRole( 'menu', {
				name: 'Options',
			} )
			.getByRole( 'menuitem', {
				name: 'Add submenu',
			} );

		await addSubmenuAction.click();

		await linkControl.searchFor( 'https://wordpress.org' );

		await page.keyboard.press( 'Enter' );

		// Check the new item was inserted in the correct place.
		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'wordpress.org',
				} )
				.filter( {
					hasText: 'Block 1 of 1, Level 2.', // proxy for filtering by description.
				} )
		).toBeVisible();

		// Check that the original item is still there but that it is now
		// a submenu item.
		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'Top Level Item 1',
				} )
				.filter( {
					hasText: 'Block 1 of 2, Level 1.', // proxy for filtering by description.
				} )
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
				name: 'Add page',
			} )
			.click();

		// Expect the Link UI to be focused.
		await expect( linkControl.getSearchInput() ).toBeFocused();

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

	test( `can create a new menu without losing focus`, async ( {
		page,
		editor,
		requestUtils,
	} ) => {
		await requestUtils.createNavigationMenu( navMenuBlocksFixture );

		await editor.insertBlock( { name: 'core/navigation' } );

		await editor.openDocumentSettingsSidebar();

		await page
			.getByRole( 'tabpanel' )
			.getByRole( 'button', { name: 'Test Menu' } )
			.click();

		await page.keyboard.press( 'ArrowUp' );

		await expect(
			page.getByRole( 'menuitem', { name: 'Create new Menu' } )
		).toBeFocused();

		await page.keyboard.press( 'Enter' );

		await expect(
			page.getByText( 'This Navigation Menu is empty.' )
		).toBeVisible();

		// Move focus to the appender
		await page.keyboard.press( 'ArrowDown' );
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Block: Navigation',
				} )
				.getByLabel( 'Add page' )
		).toBeFocused();
	} );

	test( 'can create a new menu again after creating one fails', async ( {
		page,
		editor,
		requestUtils,
	} ) => {
		// Start from one menu, so the menu list ends in "Create new Menu".
		await requestUtils.deleteAllMenus();
		await requestUtils.createNavigationMenu( navMenuBlocksFixture );

		// Fail the first request that creates a menu.
		let failedRequests = 0;
		await page.route( '**/wp/v2/navigation**', async ( route ) => {
			if ( route.request().method() === 'POST' && failedRequests === 0 ) {
				failedRequests++;
				await route.fulfill( {
					status: 500,
					json: { code: 'test_error', message: 'Test error' },
				} );
				return;
			}
			await route.continue();
		} );

		await editor.insertBlock( { name: 'core/navigation' } );
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'tabpanel' )
			.getByRole( 'button', { name: 'Test Menu' } )
			.click();
		await page.keyboard.press( 'ArrowUp' );
		const createNewMenu = page.getByRole( 'menuitem', {
			name: 'Create new Menu',
		} );
		await expect( createNewMenu ).toBeFocused();

		await page.keyboard.press( 'Enter' );
		await expect( page.getByTestId( 'snackbar' ) ).toHaveText(
			'Failed to create Navigation Menu.'
		);
		expect( failedRequests ).toBe( 1 );

		await expect( createNewMenu ).toBeEnabled();
	} );

	test( 'displays custom menu name in List View tab header in contentOnly mode', async ( {
		page,
		editor,
		requestUtils,
		pageUtils,
	} ) => {
		// Create a navigation menu with a custom name.
		const headerMenu = await requestUtils.createNavigationMenu( {
			title: 'Header Menu',
			content: navMenuBlocksFixture.content,
		} );

		// Use the code editor to insert a contentOnly-locked group containing
		// the navigation block. This triggers contentOnly mode where
		// isSelectionWithinCurrentSection is true.
		await pageUtils.pressKeys( 'secondary+M' );
		await page
			.getByPlaceholder( 'Start writing with text or HTML' )
			.fill(
				`<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->` +
					`<div class="wp-block-group">` +
					`<!-- wp:navigation {"ref":${ headerMenu.id }} /-->` +
					`</div>` +
					`<!-- /wp:group -->`
			);
		await pageUtils.pressKeys( 'secondary+M' );

		// Select the navigation block inside the contentOnly group.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Navigation' } )
			.click();

		await editor.openDocumentSettingsSidebar();

		// Click the List View tab.
		const listViewTab = page.getByRole( 'tab', { name: 'List View' } );
		await listViewTab.click();

		const listViewPanel = page.getByRole( 'tabpanel', {
			name: 'List View',
		} );

		// In contentOnly mode, the PanelBody title should show the custom
		// menu name as a collapsible panel button.
		await expect(
			listViewPanel.getByRole( 'button', { name: 'Header Menu' } )
		).toBeVisible();
	} );

	test( 'nests and un-nests menu items by dragging across the indentation', async ( {
		page,
		editor,
		requestUtils,
	} ) => {
		await requestUtils.createNavigationMenu( {
			title: 'Test Menu',
			content: `<!-- wp:navigation-link {"label":"Item 1","type":"custom","url":"https://wordpress.org/1","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"Item 2","type":"custom","url":"https://wordpress.org/2","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"Item 3","type":"custom","url":"https://wordpress.org/3","kind":"custom"} /-->`,
		} );

		await editor.insertBlock( { name: 'core/navigation' } );
		await editor.openDocumentSettingsSidebar();

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
			description: 'Structure for navigation menu: Test Menu',
		} );
		const item = ( name ) =>
			listView.getByRole( 'gridcell', { name, exact: true } );

		await expect( item( 'Item 3' ) ).toBeVisible();

		await test.step( 'dragging an item down and to the right nests it in the item above', async () => {
			await dragListViewBlockTo( editor, {
				from: item( 'Item 1' ),
				to: item( 'Item 2' ),
				indentation: 2,
			} );

			// Item 2 becomes a submenu holding Item 1.
			await expect(
				item( 'Item 1' ).filter( { hasText: 'Block 1 of 1, Level 2.' } )
			).toBeVisible();
			await expect(
				item( 'Item 2' ).filter( { hasText: 'Block 1 of 2, Level 1.' } )
			).toBeVisible();
		} );

		await test.step( 'dragging an item down and to the left moves it out of the submenu', async () => {
			await dragListViewBlockTo( editor, {
				from: item( 'Item 1' ),
				to: item( 'Item 3' ),
				indentation: 1,
			} );

			await expect(
				item( 'Item 1' ).filter( { hasText: 'Block 3 of 3, Level 1.' } )
			).toBeVisible();
		} );

		await test.step( 'dragging an item up and to the right nests it in the item above', async () => {
			await dragListViewBlockTo( editor, {
				from: item( 'Item 3' ),
				to: item( 'Item 2' ),
				indentation: 2,
			} );

			await expect(
				item( 'Item 3' ).filter( { hasText: 'Block 1 of 1, Level 2.' } )
			).toBeVisible();
		} );

		await test.step( 'dragging a nested item to the left of its level un-nests it', async () => {
			// Put a second item in the submenu so there is a row to drop below.
			await dragListViewBlockTo( editor, {
				from: item( 'Item 1' ),
				to: item( 'Item 3' ),
				indentation: 2,
			} );
			await expect(
				item( 'Item 1' ).filter( { hasText: 'Block 2 of 2, Level 2.' } )
			).toBeVisible();

			await dragListViewBlockTo( editor, {
				from: item( 'Item 1' ),
				to: item( 'Item 3' ),
				indentation: 1,
			} );

			await expect(
				item( 'Item 1' ).filter( { hasText: 'Block 2 of 2, Level 1.' } )
			).toBeVisible();
			await expect(
				item( 'Item 3' ).filter( { hasText: 'Block 1 of 1, Level 2.' } )
			).toBeVisible();
		} );
	} );

	test( 'nests the last menu item in the item above it after the drag passes over that item', async ( {
		page,
		editor,
		requestUtils,
	} ) => {
		await requestUtils.createNavigationMenu( {
			title: 'Test Menu',
			content: `<!-- wp:navigation-link {"label":"Item 1","type":"custom","url":"https://wordpress.org/1","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"Item 2","type":"custom","url":"https://wordpress.org/2","kind":"custom"} /-->`,
		} );

		await editor.insertBlock( { name: 'core/navigation' } );
		await editor.openDocumentSettingsSidebar();

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
			description: 'Structure for navigation menu: Test Menu',
		} );
		const item = ( name ) =>
			listView.getByRole( 'gridcell', { name, exact: true } );

		await expect( item( 'Item 2' ) ).toBeVisible();

		// The dragged item is the last row, so no row follows it to bound the
		// gap the drop indicator opens: the cursor settles over the dragged
		// item's own slot.
		await dragListViewBlockTo( editor, {
			from: item( 'Item 2' ),
			to: item( 'Item 1' ),
			indentation: 2,
			overshoot: true,
		} );

		await expect(
			item( 'Item 2' ).filter( { hasText: 'Block 1 of 1, Level 2.' } )
		).toBeVisible();
	} );

	test( 'adds a navigation link from the List View appender in a contentOnly locked section', async ( {
		editor,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Header Menu',
			content: navMenuBlocksFixture.content,
		} );

		await editor.setContent(
			`<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->` +
				`<div class="wp-block-group">` +
				`<!-- wp:navigation {"ref":${ menu.id }} /-->` +
				`</div>` +
				`<!-- /wp:group -->`
		);

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Navigation' } )
			.click();
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'tab', { name: 'List View' } ).click();

		const listView = page
			.getByRole( 'tabpanel', { name: 'List View' } )
			.getByRole( 'treegrid', { name: 'Block navigation structure' } );

		await expect(
			listView.getByRole( 'link', { name: 'Top Level Item 1' } )
		).toBeVisible();
		// Items can be added here, as the canvas appender shows, so the List
		// View offers its appender too.
		const appender = listView.getByRole( 'button', { name: 'Add page' } );
		await expect( appender ).toBeVisible();
		await appender.click();

		await linkControl.searchFor( 'Test Page 1' );
		await ( await linkControl.getNthSearchResult( 0 ) ).click();

		await expect(
			listView.getByRole( 'link', { name: 'Test Page 1' } )
		).toBeVisible();
	} );

	test( 'edits a Button from the List View popover in a contentOnly locked section', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Header Menu',
			content:
				navMenuBlocksFixture.content +
				`<!-- wp:buttons -->` +
				`<div class="wp-block-buttons">` +
				`<!-- wp:button {"linkTarget":"_blank","rel":"noopener"} -->` +
				`<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="https://wordpress.org/" target="_blank" rel="noopener">Buy now</a></div>` +
				`<!-- /wp:button -->` +
				`</div>` +
				`<!-- /wp:buttons -->`,
		} );

		await editor.setContent(
			`<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->` +
				`<div class="wp-block-group">` +
				`<!-- wp:navigation {"ref":${ menu.id }} /-->` +
				`</div>` +
				`<!-- /wp:group -->`
		);

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Navigation' } )
			.click();
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'tab', { name: 'List View' } ).click();

		const listView = page
			.getByRole( 'tabpanel', { name: 'List View' } )
			.getByRole( 'treegrid', { name: 'Block navigation structure' } );

		// The popover offers the same fields as a navigation link.
		await listView.getByRole( 'link', { name: 'Buy now' } ).click();

		await expect(
			page.getByRole( 'heading', { name: 'Settings' } )
		).toBeVisible();
		const textInput = page.getByRole( 'textbox', { name: 'Text' } );
		await expect( textInput ).toHaveValue( 'Buy now' );
		await expect(
			page.getByRole( 'button', { name: /^Link to/ } )
		).toHaveText( /wordpress\.org/ );
		await expect(
			page.getByRole( 'checkbox', { name: 'Open in new tab' } )
		).toBeChecked();
		await expect(
			page.getByRole( 'link', { name: 'View' } )
		).toHaveAttribute( 'href', 'https://wordpress.org/' );

		// Edits reach the block.
		await textInput.fill( 'Shop now' );
		await page
			.getByRole( 'checkbox', { name: 'Open in new tab' } )
			.uncheck();

		await expect(
			listView.getByRole( 'link', { name: 'Shop now' } )
		).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Button text' } )
		).toHaveText( 'Shop now' );
		const buttonBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Button',
			exact: true,
		} );
		const clientId = await buttonBlock.getAttribute( 'data-block' );
		expect(
			await page.evaluate(
				( id ) =>
					window.wp.data
						.select( 'core/block-editor' )
						.getBlockAttributes( id ),
				clientId
			)
		).toMatchObject( {
			text: 'Shop now',
			url: 'https://wordpress.org/',
		} );
		expect(
			await page.evaluate( ( id ) => {
				const { linkTarget, rel } = window.wp.data
					.select( 'core/block-editor' )
					.getBlockAttributes( id );
				return { linkTarget, rel };
			}, clientId )
		).toEqual( { linkTarget: undefined, rel: undefined } );
	} );
} );

/**
 * Drags a List View row onto the bottom half of another row, with the cursor
 * over the given indentation level, and drops it there.
 *
 * @param {Object}  editor              Editor utils.
 * @param {Object}  options
 * @param {Object}  options.from        Locator of the dragged row's cell.
 * @param {Object}  options.to          Locator of the target row's cell.
 * @param {number}  options.indentation Nesting level to hold the cursor over. `1` is the
 *                                      target's own level, `2` nests inside it.
 * @param {boolean} [options.overshoot] Pass over the top half of the target first, then come
 *                                      back down to the drop position, the way a hand-driven
 *                                      drag settles after passing its target.
 */
async function dragListViewBlockTo(
	editor,
	{ from, to, indentation, overshoot = false }
) {
	const { page } = editor;
	// The drop zone measures the cursor against positions 24px apart from the
	// row's left edge, one per nesting level, and rounds to the nearest one.
	// Stay a few pixels right of the requested level's position so the
	// rounding resolves to that level.
	const NESTING_LEVEL_INDENTATION = 24;
	const fromRow = from.locator( 'xpath=ancestor::*[@role="row"][1]' );
	const toRow = to.locator( 'xpath=ancestor::*[@role="row"][1]' );
	const fromRect = await fromRow.boundingBox();
	const toRect = await toRow.boundingBox();
	const x =
		toRect.x +
		NESTING_LEVEL_INDENTATION * indentation +
		NESTING_LEVEL_INDENTATION / 4;
	let y = toRect.y + toRect.height * 0.75;

	await from.hover();
	await page.mouse.down();
	await page.mouse.move( x, fromRect.y + fromRect.height / 2, { steps: 5 } );
	if ( overshoot ) {
		await page.mouse.move( x, toRect.y + 6, { steps: 20 } );
		// Disable reason: Let the rows displace before coming back down.
		/* eslint-disable playwright/no-wait-for-timeout */
		await editor.page.waitForTimeout( 300 );
		/* eslint-enable playwright/no-wait-for-timeout */
		// The target row has shifted down a row to make room for the drop
		// indicator above it; its bottom half is now a row lower.
		y += toRect.height;
	}
	await page.mouse.move( x, y, { steps: 20 } );
	// Dispatch a final dragover at the drop position; see
	// https://playwright.dev/docs/input#dragging-manually
	await page.mouse.move( x + 1, y, { steps: 2 } );

	// Disable reason: Need to wait until the throttle timeout of 250ms has passed.
	/* eslint-disable playwright/no-wait-for-timeout */
	await editor.page.waitForTimeout( 300 );
	/* eslint-enable playwright/no-wait-for-timeout */

	await page.mouse.up();
}

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
			.last()
			.innerText();
	}

	async getSearchResultType( result ) {
		await expect( result ).toBeVisible();

		// The entity type renders as a sibling of the label, so it is not part
		// of the text returned by getSearchResultText.
		return result.locator( '.components-menu-item__shortcut' ).innerText();
	}
}
