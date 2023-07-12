/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Navigation block', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		//TT3 is preferable to emptytheme because it already has the navigation block on its templates.
		await requestUtils.activateTheme( 'twentytwentythree' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await Promise.all( [ requestUtils.deleteAllMenus() ] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllMenus(),
			requestUtils.activateTheme( 'twentytwentyone' ),
		] );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllMenus();
	} );

	test.describe( 'As a user I want the navigation block to fallback to the best possible default', () => {
		test( 'default to a list of pages if there are no menus', async ( {
			admin,
			editor,
		} ) => {
			await admin.createNewPost();
			await editor.insertBlock( { name: 'core/navigation' } );

			const pageListBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Page List',
			} );

			await expect( pageListBlock ).toBeVisible( {
				// Wait for the Nav and Page List block API requests to resolve.
				// Note: avoid waiting on network requests as these are not perceivable
				// to the user.
				// See: https://github.com/WordPress/gutenberg/pull/45070#issuecomment-1373712007.
				timeout: 10000,
			} );

			// Check the markup of the block is correct.
			await editor.publishPost();
			const content = await editor.getEditedPostContent();

			expect( content ).toMatch( /<!-- wp:navigation {"ref":\d+} \/-->/ );
		} );

		test( 'default to my only existing menu', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await admin.createNewPost();
			const createdMenu = await requestUtils.createNavigationMenu( {
				title: 'Test Menu 1',
				content:
					'<!-- wp:navigation-link {"label":"WordPress","type":"custom","url":"http://www.wordpress.org/","kind":"custom"} /-->',
			} );

			await editor.insertBlock( { name: 'core/navigation' } );

			// Check the block in the canvas.
			await expect(
				editor.canvas.locator(
					`role=textbox[name="Navigation link text"i] >> text="WordPress"`
				)
			).toBeVisible();

			// Check the markup of the block is correct.
			await editor.publishPost();
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/navigation',
					attributes: { ref: createdMenu.id },
				},
			] );
			await page.locator( 'role=button[name="Close panel"i]' ).click();

			// Check the block in the frontend.
			await page.goto( '/' );
			await expect(
				page.locator(
					`role=navigation >> role=link[name="WordPress"i]`
				)
			).toBeVisible();
		} );

		test( 'default to the only existing classic menu if there are no block menus', async ( {
			admin,
			page,
			editor,
			requestUtils,
		} ) => {
			// Create a classic menu.
			await requestUtils.createClassicMenu( 'Test Classic 1' );
			await admin.createNewPost();

			await editor.insertBlock( { name: 'core/navigation' } );
			// We need to check the canvas after inserting the navigation block to be able to target the block.
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/navigation',
				},
			] );

			// Check the block in the canvas.
			await expect(
				editor.canvas.locator(
					`role=textbox[name="Navigation link text"i] >> text="Custom link"`
				)
			).toBeVisible( { timeout: 10000 } ); // allow time for network request.

			// Check the block in the frontend.
			await page.goto( '/' );

			await expect(
				page.locator(
					`role=navigation >> role=link[name="Custom link"i]`
				)
			).toBeVisible();
		} );

		test( 'default to my most recently created menu', async ( {
			admin,
			page,
			editor,
			requestUtils,
		} ) => {
			await admin.createNewPost();
			await requestUtils.createNavigationMenu( {
				title: 'Test Menu 1',
				content:
					'<!-- wp:navigation-link {"label":"Menu 1 Link","type":"custom","url":"http://localhost:8889/#menu-1-link","kind":"custom"} /-->',
			} );

			//FIXME this is needed because if the two menus are created at the same time, the API will return them in the wrong order.
			//https://core.trac.wordpress.org/ticket/57914
			await editor.page.waitForTimeout( 1000 );

			const latestMenu = await requestUtils.createNavigationMenu( {
				title: 'Test Menu 2',
				content:
					'<!-- wp:navigation-link {"label":"Menu 2 Link","type":"custom","url":"http://localhost:8889/#menu-2-link","kind":"custom"} /-->',
			} );

			await editor.insertBlock( { name: 'core/navigation' } );

			// Check the markup of the block is correct.
			await editor.publishPost();
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/navigation',
					attributes: { ref: latestMenu.id },
				},
			] );
			await page.locator( 'role=button[name="Close panel"i]' ).click();

			// Check the block in the canvas.
			await expect(
				editor.canvas.locator(
					`role=textbox[name="Navigation link text"i] >> text="Menu 2 Link"`
				)
			).toBeVisible();

			// Check the block in the frontend.
			await page.goto( '/' );
			await expect(
				page.locator(
					`role=navigation >> role=link[name="Menu 2 Link"i]`
				)
			).toBeVisible();
		} );
	} );

	test.describe( 'As a user I want to create submenus using the navigation block', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			//TT3 is preferable to emptytheme because it already has the navigation block on its templates.
			await requestUtils.activateTheme( 'twentytwentythree' );
		} );

		test.beforeEach( async ( { requestUtils } ) => {
			await Promise.all( [ requestUtils.deleteAllMenus() ] );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await Promise.all( [
				requestUtils.deleteAllMenus(),
				requestUtils.activateTheme( 'twentytwentyone' ),
			] );
		} );

		test.afterEach( async ( { requestUtils } ) => {
			await requestUtils.deleteAllPosts();
		} );

		test( 'create a submenu', async ( {
			admin,
			page,
			editor,
			requestUtils,
		} ) => {
			await admin.createNewPost();
			await requestUtils.createNavigationMenu( {
				title: 'Test Menu',
				content: '',
			} );

			await editor.insertBlock( { name: 'core/navigation' } );

			const navBlockInserter = editor.canvas.getByRole( 'button', {
				name: 'Add block',
			} );
			await navBlockInserter.click();

			await page.keyboard.type( 'https://example.com' );
			await page.keyboard.press( 'Enter' );

			const addSubmenuButton = page.getByRole( 'button', {
				name: 'Add submenu',
			} );
			await addSubmenuButton.click();

			await editor.publishPost();

			await page.locator( 'role=button[name="Close panel"i]' ).click();

			await page.goto( '/' );
			await expect(
				page.locator(
					`role=navigation >> role=button[name="example.com submenu "i]`
				)
			).toBeVisible();
		} );

		test( 'submenu converts to link automatically', async ( {
			admin,
			pageUtils,
			editor,
			requestUtils,
		} ) => {
			await admin.createNewPost();
			await requestUtils.createNavigationMenu( {
				title: 'Test Menu',
				content:
					'<!-- wp:navigation-submenu {"label":"WordPress","type":"custom","url":"http://www.wordpress.org/","kind":"custom"} --><!-- wp:navigation-link {"label":"WordPress Child","type":"custom","url":"http://www.wordpress.org/","kind":"custom"} /--><!-- /wp:navigation-submenu -->',
			} );

			await editor.insertBlock( { name: 'core/navigation' } );

			await expect(
				editor.canvas.locator(
					`role=textbox[name="Navigation link text"i] >> text="WordPress"`
				)
			).toBeVisible();

			const navigationBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Navigation',
			} );
			await editor.selectBlocks( navigationBlock );

			const submenuBlock1 = editor.canvas.getByRole( 'document', {
				name: 'Block: Submenu',
			} );
			await expect( submenuBlock1 ).toBeVisible();

			// select the child link via keyboard
			await pageUtils.pressKeys( 'ArrowDown' );
			await pageUtils.pressKeys( 'ArrowDown' );
			await pageUtils.pressKeys( 'ArrowDown' );

			// remove the child link
			await pageUtils.pressKeys( 'access+z' );

			const submenuBlock2 = editor.canvas.getByRole( 'document', {
				name: 'Block: Submenu',
			} );
			await expect( submenuBlock2 ).toBeHidden();
		} );
	} );

	test.describe( 'As a user I want to see a warning if the menu referenced by a navigation block is not available', () => {
		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost();
		} );

		test( 'warning message shows when given an unknown ref', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: {
					ref: 1,
				},
			} );

			// Check the markup of the block is correct.
			await editor.publishPost();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/navigation',
					attributes: { ref: 1 },
				},
			] );

			// Find the warning message
			const warningMessage = editor.canvas
				.getByRole( 'document', { name: 'Block: Navigation' } )
				.getByText(
					'Navigation menu has been deleted or is unavailable.'
				);
			await expect( warningMessage ).toBeVisible();
		} );
	} );

	test.describe( 'Existing blocks', () => {
		test( 'adding new links to a block with existing inner blocks triggers creation of a single Navigation Menu', async ( {
			admin,
			page,
			editor,
			requestUtils,
		} ) => {
			// As this test depends on there being no menus,
			// we need to delete any existing menus as an explicit
			// precondition rather than rely on global test setup.
			await requestUtils.deleteAllMenus();

			// Ensure that there are no menus before beginning the test.
			expect(
				await requestUtils.getNavigationMenus( {
					status: [ 'publish', 'draft' ],
				} )
			).toHaveLength( 0 );

			await admin.createNewPost();

			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: {},
				innerBlocks: [
					{
						name: 'core/page-list',
					},
				],
			} );

			const navBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Navigation',
			} );

			await expect(
				editor.canvas.getByRole( 'document', {
					name: 'Block: Page List',
				} )
			).toBeVisible();

			await expect( navBlock ).toBeVisible();

			await editor.selectBlocks( navBlock );

			await navBlock.getByRole( 'button', { name: 'Add block' } ).click();

			// This relies on network so allow additional time for
			// the request to complete.
			await expect(
				page.getByRole( 'button', {
					name: 'Dismiss this notice',
					text: 'Navigation Menu successfully created',
				} )
			).toBeVisible( { timeout: 10000 } );

			// The creattion Navigaiton Menu will be a draft
			// so we need to check for both publish and draft.
			expect(
				await requestUtils.getNavigationMenus( {
					status: [ 'publish', 'draft' ],
				} )
			).toHaveLength( 1 );
		} );
	} );

	test.describe( 'List view editing', () => {
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

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllPages();
		} );

		test.use( {
			linkControl: async ( { page }, use ) => {
				await use( new LinkControl( { page } ) );
			},
		} );

		test( 'show a list view in the inspector controls', async ( {
			admin,
			page,
			editor,
			requestUtils,
		} ) => {
			await admin.createNewPost();
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
			admin,
			page,
			editor,
			requestUtils,
		} ) => {
			await admin.createNewPost();
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
			admin,
			page,
			editor,
			requestUtils,
			linkControl,
		} ) => {
			await admin.createNewPost();
			const { id: menuId } = await requestUtils.createNavigationMenu(
				navMenuBlocksFixture
			);

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
			await expect( blockResultOptions.nth( 0 ) ).toHaveText(
				'Page Link'
			);
			await expect( blockResultOptions.nth( 1 ) ).toHaveText(
				'Custom Link'
			);

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
			const firstResultText = await linkControl.getSearchResultText(
				firstResult
			);

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

		test( `can remove menu items`, async ( {
			admin,
			page,
			editor,
			requestUtils,
		} ) => {
			await admin.createNewPost();
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
			).not.toBeVisible();
		} );

		test( `can edit menu items`, async ( {
			admin,
			page,
			editor,
			requestUtils,
		} ) => {
			await admin.createNewPost();
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
			admin,
			page,
			editor,
			requestUtils,
			linkControl,
		} ) => {
			await admin.createNewPost();
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
			admin,
			page,
			editor,
			requestUtils,
			linkControl,
		} ) => {
			// Provides coverage for a bug whereby the Link UI would be unexpectedly displayed for the last
			// inserted block even if the block had been deselected and then reselected.
			// See: https://github.com/WordPress/gutenberg/issues/50601

			await admin.createNewPost();
			const { id: menuId } = await requestUtils.createNavigationMenu(
				navMenuBlocksFixture
			);

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
			await expect( linkControl.getSearchInput() ).not.toBeVisible();
		} );
	} );

	test.describe( 'Navigation colors', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			// We want emptytheme because it doesn't have any styles
			await requestUtils.activateTheme( 'emptytheme' );
			await requestUtils.deleteAllTemplates( 'wp_template_part' );
			await requestUtils.deleteAllMenus();
			await requestUtils.deleteAllPages();
		} );

		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//header',
				postType: 'wp_template_part',
			} );
			await editor.canvas.click( 'body' );
			const { id: pageId } = await requestUtils.createPage( {
				title: 'Test Page',
				status: 'publish',
			} );
			const { id: menuId } = await requestUtils.createNavigationMenu( {
				title: 'Colored menu',
				content: `<!-- wp:navigation-submenu {"label":"Custom Link","type":"custom","url":"https://wordpress.org","kind":"custom"} --><!-- wp:navigation-link {"label":"Submenu Link","type":"custom","url":"https://wordpress.org","kind":"custom"} /--><!-- /wp:navigation-submenu --><!-- wp:navigation-link {"label":"Page Link","type":"page","id": ${ pageId },"url":"http://localhost:8889/?page_id=${ pageId }","kind":"post-type"} /-->`,
				attributes: { openSubmenusOnClick: true },
			} );
			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: {
					ref: menuId,
				},
			} );

			await editor.saveSiteEditorEntities();
			await admin.visitSiteEditor();
			await editor.canvas.click( 'body' );
			// Focus the navigation block inside the header template part
			await editor.canvas
				.getByRole( 'document', { name: 'Block: header' } )
				.focus();
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Navigation' } )
				.click();
		} );

		test.afterEach( async ( { requestUtils } ) => {
			await requestUtils.deleteAllTemplates( 'wp_template_part' );
			await requestUtils.deleteAllMenus();
			await requestUtils.deleteAllPages();
		} );

		test.use( {
			colorControl: async ( { admin, editor, page, pageUtils }, use ) => {
				await use(
					new ColorControl( { admin, editor, page, pageUtils } )
				);
			},
		} );

		test( 'All navigation links should default to the body color and submenus and mobile overlay should default to a white background with black text', async ( {
			page,
			colorControl,
		} ) => {
			const expectedNavigationColors = {
				textColor: colorControl.black,
				backgroundColor: colorControl.transparent, // There should be no background color set even though the body background is black
				submenuTextColor: colorControl.black,
				submenuBackgroundColor: colorControl.white,
			};

			await colorControl.testEditorColors( expectedNavigationColors );

			// And finally we check the colors of the links on the frontend
			await page.goto( '/' );

			await colorControl.testFrontendColors( expectedNavigationColors );
		} );

		test( 'Top level navigation links inherit the text color from the theme/group but do not apply to the submenu or overlay text', async ( {
			page,
			editor,
			colorControl,
		} ) => {
			// Set the text and background styles for the group. The text color should apply to the top level links but not the submenu or overlay.
			// We wrap the nav block inside a group block
			await page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Options' } )
				.click();
			await page.getByRole( 'menuitem', { name: 'Group' } ).click();

			// In the sidebar inspector we add a link color and link hover color to the group block
			await editor.openDocumentSettingsSidebar();
			await page.getByRole( 'tab', { name: 'Styles' } ).click();
			await page
				.getByRole( 'button', { name: 'Color Text styles' } )
				.click();
			await page
				.getByRole( 'button', { name: 'Color: White' } )
				.click( { force: true } );

			await page
				.getByRole( 'button', { name: 'Color Background styles' } )
				.click();
			await page
				.getByRole( 'button', { name: 'Color: Black' } )
				.click( { force: true } );

			// Save them so we can check on the frontend later too.
			await editor.saveSiteEditorEntities();
			// Close the sidebar so our selectors don't accidentally select the sidebar links instead of the editor canvas
			await page
				.getByRole( 'button', { name: 'Close Settings' } )
				.click( { force: true } );

			await editor.canvas.click( 'body' );

			// Focus the navigation block inside the header template part
			await editor.canvas
				.getByRole( 'document', { name: 'Block: header' } )
				.focus();
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Navigation' } )
				.click();

			const expectedNavigationColors = {
				textColor: colorControl.white,
				backgroundColor: colorControl.transparent, // There should be no background color set even though the body background is black
				submenuTextColor: colorControl.black,
				submenuBackgroundColor: colorControl.white,
			};

			await colorControl.testEditorColors( expectedNavigationColors );

			// And finally we check the colors of the links on the frontend
			await page.goto( '/' );

			await colorControl.testFrontendColors( expectedNavigationColors );
		} );

		test( 'Navigation text does not inherit the link color from the theme/group', async ( {
			page,
			editor,
			colorControl,
		} ) => {
			// Wrap the nav block inside a group block
			await page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Options' } )
				.click();
			await page.getByRole( 'menuitem', { name: 'Group' } ).click();

			// In the sidebar inspector we add a link color and link hover color to the group block
			await editor.openDocumentSettingsSidebar();
			await page.getByRole( 'tab', { name: 'Styles' } ).click();
			await page.getByRole( 'button', { name: 'Color options' } ).click();
			await page
				.getByRole( 'menuitemcheckbox', { name: 'Show Link' } )
				.click();
			await page.getByRole( 'tab', { name: 'Styles' } ).click();
			await page
				.getByRole( 'button', { name: 'Color Link styles' } )
				.click();
			// rga(207, 46 ,46) is the color of the "vivid red" color preset
			await page
				.getByRole( 'button', { name: 'Color: Vivid red' } )
				.click( { force: true } );
			await page.getByRole( 'tab', { name: 'Hover' } ).click();
			// rgb(155, 81, 224) is the color of the "vivid purple" color preset
			await page
				.getByRole( 'button', { name: 'Color: Vivid purple' } )
				.click( { force: true } );

			// Save them so we can check on the frontend later too.
			await editor.saveSiteEditorEntities();
			// Close the sidebar so our selectors don't accidentally select the sidebar links instead of the editor canvas
			await page
				.getByRole( 'button', { name: 'Close Settings' } )
				.click( { force: true } );

			await editor.canvas.click( 'body' );

			// Focus the navigation block inside the header template part
			await editor.canvas
				.getByRole( 'document', { name: 'Block: header' } )
				.focus();
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Navigation' } )
				.click();

			const expectedNavigationColors = {
				textColor: colorControl.black,
				backgroundColor: colorControl.transparent,
				submenuTextColor: colorControl.black,
				submenuBackgroundColor: colorControl.white,
			};

			await colorControl.testEditorColors( expectedNavigationColors );

			// And finally we check the colors of the links on the frontend
			await page.goto( '/' );

			await colorControl.testFrontendColors( expectedNavigationColors );
		} );

		test( 'The navigation text color should apply to all navigation links including submenu and overlay text', async ( {
			page,
			editor,
			colorControl,
		} ) => {
			await editor.openDocumentSettingsSidebar();

			// In the inspector sidebar, we change the nav block colors
			await page.getByRole( 'tab', { name: 'Styles' } ).click();
			// Pale pink for the text color
			await page
				.getByRole( 'button', { name: 'Text', exact: true } )
				.click();
			// 247, 141, 167 is the color of the "Pale pink" color preset
			const palePink = 'rgb(247, 141, 167)';
			await page
				.getByRole( 'button', { name: 'Color: Pale pink' } )
				.click( { force: true } );

			await editor.saveSiteEditorEntities();
			// Close the sidebar so our selectors don't accidentally select the sidebar links instead of the editor canvas
			await page
				.getByRole( 'button', { name: 'Close Settings' } )
				.click( { force: true } );

			await editor.canvas.click( 'body' );

			// Focus the navigation block inside the header template part
			await editor.canvas
				.getByRole( 'document', { name: 'Block: header' } )
				.focus();
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Navigation' } )
				.click();

			const expectedNavigationColors = {
				textColor: palePink,
				backgroundColor: colorControl.transparent, // There should be no background color set
				submenuTextColor: palePink,
				submenuBackgroundColor: colorControl.white,
			};

			await colorControl.testEditorColors( expectedNavigationColors );

			// And finally we check the colors of the links on the frontend
			await page.goto( '/' );

			await colorControl.testFrontendColors( expectedNavigationColors );
		} );

		test( 'The navigation background color should apply to all navigation links including submenu and overlay backgrounds', async ( {
			page,
			editor,
			colorControl,
		} ) => {
			await editor.openDocumentSettingsSidebar();

			// In the inspector sidebar, we change the nav block colors
			await page.getByRole( 'tab', { name: 'Styles' } ).click();
			// Pale pink for the text color
			await page
				.getByRole( 'button', { name: 'Background', exact: true } )
				.click();
			// 142, 209, 252 is the color of the "Pale cyan blue" color preset
			const paleCyan = 'rgb(142, 209, 252)';
			await page
				.getByRole( 'button', { name: 'Color: Pale cyan blue' } )
				.click( { force: true } );

			await editor.saveSiteEditorEntities();
			// Close the sidebar so our selectors don't accidentally select the sidebar links instead of the editor canvas
			await page
				.getByRole( 'button', { name: 'Close Settings' } )
				.click( { force: true } );
			await editor.canvas.click( 'body' );

			// Focus the navigation block inside the header template part
			await editor.canvas
				.getByRole( 'document', { name: 'Block: header' } )
				.focus();
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Navigation' } )
				.click();

			// The navigation background, submenu background and overlay background should all be paleCyan
			const expectedNavigationColors = {
				textColor: colorControl.black,
				backgroundColor: paleCyan,
				submenuTextColor: colorControl.black,
				submenuBackgroundColor: paleCyan,
			};

			await colorControl.testEditorColors( expectedNavigationColors );

			// And finally we check the colors of the links on the frontend
			await page.goto( '/' );

			await colorControl.testFrontendColors( expectedNavigationColors );
		} );

		test( 'As a user I expect my navigation to use the colors I selected for it', async ( {
			editor,
			page,
			colorControl,
		} ) => {
			await editor.openDocumentSettingsSidebar();

			// In the inspector sidebar, we change the nav block colors
			await page.getByRole( 'tab', { name: 'Styles' } ).click();
			// Pale pink for the text color
			await page
				.getByRole( 'button', { name: 'Text', exact: true } )
				.click();
			// 247, 141, 167 is the color of the "Pale pink" color preset
			const palePink = 'rgb(247, 141, 167)';
			await page
				.getByRole( 'button', { name: 'Color: Pale pink' } )
				.click( { force: true } );
			// Pale cyan blue for the background color
			await page
				.getByRole( 'button', { name: 'Background', exact: true } )
				.click();
			// 142, 209, 252 is the color of the "Pale cyan blue" color preset
			const paleCyan = 'rgb(142, 209, 252)';
			await page
				.getByRole( 'button', { name: 'Color: Pale cyan blue' } )
				.click( { force: true } );
			// Cyan bluish gray for the submenu and overlay text color
			await page
				.getByRole( 'button', { name: 'Submenu & overlay text' } )
				.click();
			// 171, 184, 195 is the color of the "Cyan bluish gray" color preset
			const cyanBluishGray = 'rgb(171, 184, 195)';
			await page
				.getByRole( 'button', { name: 'Color: Cyan bluish gray' } )
				.click( { force: true } );
			// Luminous vivid amber for the submenu and overlay background color
			await page
				.getByRole( 'button', { name: 'Submenu & overlay background' } )
				.click();
			// 252, 185, 0 is the color of the "Luminous vivid amber" color preset
			const vividAmber = 'rgb(252, 185, 0)';
			await page
				.getByRole( 'button', { name: 'Color: Luminous vivid amber' } )
				.click( { force: true } );

			await editor.saveSiteEditorEntities();
			// Close the sidebar so our selectors don't accidentally select the sidebar links instead of the editor canvas
			await page
				.getByRole( 'button', { name: 'Close Settings' } )
				.click( { force: true } );

			await editor.canvas.click( 'body' );

			// Focus the navigation block inside the header template part
			await editor.canvas
				.getByRole( 'document', { name: 'Block: header' } )
				.focus();
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Navigation' } )
				.click();

			const expectedNavigationColors = {
				textColor: palePink,
				backgroundColor: paleCyan, // There should be no background color set
				submenuTextColor: cyanBluishGray,
				submenuBackgroundColor: vividAmber,
			};

			await colorControl.testEditorColors( expectedNavigationColors );

			// And finally we check the colors of the links on the frontend
			await page.goto( '/' );

			await colorControl.testFrontendColors( expectedNavigationColors );
		} );
	} );
} );

test.describe( 'Navigation block - Frontend interactivity', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.deleteAllPages();
		await requestUtils.deleteAllMenus();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.deleteAllPages();
		await requestUtils.deleteAllMenus();
	} );

	test.describe( 'Overlay menu', () => {
		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//header',
				postType: 'wp_template_part',
			} );
			await editor.canvas.click( 'body' );
			await requestUtils.createNavigationMenu( {
				title: 'Hidden menu',
				content: `
					<!-- wp:navigation-link {"label":"Item 1","type":"custom","url":"http://www.wordpress.org/"} /-->
					<!-- wp:navigation-link {"label":"Item 2","type":"custom","url":"http://www.wordpress.org/"} /-->
					`,
			} );
			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: { overlayMenu: 'always' },
			} );
			await editor.saveSiteEditorEntities();
		} );

		test( 'Overlay menu interactions', async ( { page, pageUtils } ) => {
			await page.goto( '/' );
			const overlayMenuFirstElement = page.getByRole( 'link', {
				name: 'Item 1',
			} );
			const openMenuButton = page.getByRole( 'button', {
				name: 'Open menu',
			} );

			const closeMenuButton = page.getByRole( 'button', {
				name: 'Close menu',
			} );

			// Test: overlay menu opens on click on open menu button
			await expect( overlayMenuFirstElement ).toBeHidden();
			await openMenuButton.click();
			await expect( overlayMenuFirstElement ).toBeVisible();

			// Test: overlay menu focuses on first element after opening
			await expect( overlayMenuFirstElement ).toBeFocused();

			// Test: overlay menu traps focus
			await pageUtils.pressKeys( 'Tab', { times: 2, delay: 50 } );
			await expect( closeMenuButton ).toBeFocused();
			await pageUtils.pressKeys( 'Shift+Tab', { times: 2, delay: 50 } );
			await expect( overlayMenuFirstElement ).toBeFocused();

			// Test: overlay menu closes on click on close menu button
			await closeMenuButton.click();
			await expect( overlayMenuFirstElement ).toBeHidden();

			// Test: overlay menu closes on ESC key
			await openMenuButton.click();
			await expect( overlayMenuFirstElement ).toBeVisible();
			await pageUtils.pressKeys( 'Escape' );
			await expect( overlayMenuFirstElement ).toBeHidden();
			await expect( openMenuButton ).toBeFocused();
		} );
	} );

	test.describe( 'Submenu mouse and keyboard interactions', () => {
		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//header',
				postType: 'wp_template_part',
			} );
			await editor.canvas.click( 'body' );
			await requestUtils.createNavigationMenu( {
				title: 'Hidden menu',
				content: `
					<!-- wp:navigation-link {"label":"Link 1","type":"custom","url":"http://www.wordpress.org/"} /-->
					<!-- wp:navigation-submenu {"label":"Simple Submenu","type":"internal","url":"#heading","kind":"custom"} -->
						<!-- wp:navigation-link {"label":"Simple Submenu Link 1","type":"custom","url":"http://www.wordpress.org/"} /-->
					<!-- /wp:navigation-submenu -->
					<!-- wp:navigation-submenu {"label":"Complex Submenu","type":"internal","url":"#heading","kind":"custom"} -->
						<!-- wp:navigation-link {"label":"Complex Submenu Link 1","type":"custom","url":"http://www.wordpress.org/"} /-->
						<!-- wp:navigation-submenu {"label":"Nested Submenu","type":"internal","url":"#heading","kind":"custom"} -->
							<!-- wp:navigation-link {"label":"Nested Submenu Link 1","type":"custom","url":"http://www.wordpress.org/"} /-->
						<!-- /wp:navigation-submenu -->
						<!-- wp:navigation-link {"label":"Complex Submenu Link 2","type":"custom","url":"http://www.wordpress.org/"} /-->
					<!-- /wp:navigation-submenu -->
					<!-- wp:navigation-link {"label":"Link 2","type":"custom","url":"http://www.wordpress.org/"} /-->
					`,
			} );
			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: { overlayMenu: 'off', openSubmenusOnClick: true },
			} );
			await editor.saveSiteEditorEntities();
		} );

		test( 'Submenu interactions', async ( { page, pageUtils } ) => {
			await page.goto( '/' );
			const simpleSubmenuButton = page.getByRole( 'button', {
				name: 'Simple Submenu',
			} );
			const innerElement = page.getByRole( 'link', {
				name: 'Simple Submenu Link 1',
			} );
			const complexSubmenuButton = page.getByRole( 'button', {
				name: 'Complex Submenu',
			} );
			const nestedSubmenuButton = page.getByRole( 'button', {
				name: 'Nested Submenu',
			} );
			const firstLevelElement = page.getByRole( 'link', {
				name: 'Complex Submenu Link 1',
			} );
			const secondLevelElement = page.getByRole( 'link', {
				name: 'Nested Submenu Link 1',
			} );

			// Test: submenu opens on click
			await expect( innerElement ).toBeHidden();
			await simpleSubmenuButton.click();
			await expect( innerElement ).toBeVisible();

			// Test: submenu closes on click outside submenu
			await page.click( 'body' );
			await expect( innerElement ).toBeHidden();

			// Test: nested submenu opens on click
			await complexSubmenuButton.click();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeHidden();

			await nestedSubmenuButton.click();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeVisible();

			// Test: nested submenus close on click outside submenu
			await page.click( 'body' );
			await expect( firstLevelElement ).toBeHidden();
			await expect( secondLevelElement ).toBeHidden();

			// Test: submenu opens on Enter keypress
			await simpleSubmenuButton.focus();
			await pageUtils.pressKeys( 'Enter' );
			await expect( innerElement ).toBeVisible();

			// Test: submenu closes on ESC key and focuses parent link
			await pageUtils.pressKeys( 'Escape' );
			await expect( innerElement ).toBeHidden();
			await expect( simpleSubmenuButton ).toBeFocused();

			// Test: submenu closes on tab outside submenu
			await simpleSubmenuButton.focus();
			await pageUtils.pressKeys( 'Enter' );
			await expect( innerElement ).toBeVisible();
			// Tab to first element, then tab outside the submenu.
			await pageUtils.pressKeys( 'Tab', { times: 2, delay: 50 } );
			await expect( innerElement ).toBeHidden();
			await expect( complexSubmenuButton ).toBeFocused();

			// Test: only nested submenu closes on tab outside
			await complexSubmenuButton.focus();
			await pageUtils.pressKeys( 'Enter' );
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeHidden();

			await nestedSubmenuButton.click();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeVisible();

			// Tab to nested submenu first element, then tab outside the nested
			// submenu.
			await pageUtils.pressKeys( 'Tab', { times: 2, delay: 50 } );
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeHidden();
			// Tab outside the complex submenu.
			await page.keyboard.press( 'Tab' );
			await expect( firstLevelElement ).toBeHidden();
		} );
	} );

	test.describe( 'Submenus (Arrow setting)', () => {
		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//header',
				postType: 'wp_template_part',
			} );
			await editor.canvas.click( 'body' );
			await requestUtils.createNavigationMenu( {
				title: 'Hidden menu',
				content: `
					<!-- wp:navigation-submenu {"label":"Submenu","type":"internal","url":"#heading","kind":"custom"} -->
						<!-- wp:navigation-link {"label":"Submenu Link","type":"custom","url":"http://www.wordpress.org/"} /-->
						<!-- wp:navigation-submenu {"label":"Nested Menu","type":"internal","url":"#heading","kind":"custom"} -->
							<!-- wp:navigation-link {"label":"Nested Menu Link","type":"custom","url":"http://www.wordpress.org/"} /-->
						<!-- /wp:navigation-submenu -->
					<!-- /wp:navigation-submenu -->
					`,
			} );
			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: { overlayMenu: 'off' },
			} );
			await editor.saveSiteEditorEntities();
		} );

		test( 'submenu opens on click in the arrow', async ( { page } ) => {
			await page.goto( '/' );
			const arrowButton = page.getByRole( 'button', {
				name: 'Submenu submenu',
			} );
			const nestedSubmenuArrowButton = page.getByRole( 'button', {
				name: 'Nested Menu submenu',
			} );
			const firstLevelElement = page.getByRole( 'link', {
				name: 'Submenu Link',
			} );
			const secondLevelElement = page.getByRole( 'link', {
				name: 'Nested Menu Link',
			} );

			await expect( firstLevelElement ).toBeHidden();
			await expect( secondLevelElement ).toBeHidden();
			await arrowButton.click();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeHidden();
			await nestedSubmenuArrowButton.click();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeVisible();
			await page.click( 'body' );
			await expect( firstLevelElement ).toBeHidden();
			await expect( secondLevelElement ).toBeHidden();
		} );
	} );

	test.describe( 'Page list block', () => {
		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			const parentPage = await requestUtils.createPage( {
				title: 'Parent Page',
				status: 'publish',
			} );

			await requestUtils.createPage( {
				title: 'Subpage',
				status: 'publish',
				parent: parentPage.id,
			} );

			await admin.visitSiteEditor( {
				postId: 'emptytheme//header',
				postType: 'wp_template_part',
			} );
			await editor.canvas.click( 'body' );
			await requestUtils.createNavigationMenu( {
				title: 'Page list menu',
				content: `
					<!-- wp:page-list /-->
					<!-- wp:navigation-link {"label":"Link","type":"custom","url":"http://www.wordpress.org/"} /-->
					`,
			} );
			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: { overlayMenu: 'off', openSubmenusOnClick: true },
			} );
			await editor.saveSiteEditorEntities();
		} );

		test( 'page-list submenu user interactions', async ( {
			page,
			pageUtils,
		} ) => {
			await page.goto( '/' );
			const submenuButton = page.getByRole( 'button', {
				name: 'Parent Page',
			} );
			const innerElement = page.getByRole( 'link', {
				name: 'Subpage',
			} );
			await expect( innerElement ).toBeHidden();

			// page-list submenu opens on click
			await submenuButton.click();
			await expect( innerElement ).toBeVisible();

			// page-list submenu closes on click outside
			await page.click( 'body' );
			await expect( innerElement ).toBeHidden();

			// page-list submenu opens on enter keypress
			await submenuButton.focus();
			await pageUtils.pressKeys( 'Enter' );
			await expect( innerElement ).toBeVisible();

			// page-list submenu closes on ESC key and focuses submenu button
			await pageUtils.pressKeys( 'Escape' );
			await expect( innerElement ).toBeHidden();
			await expect( submenuButton ).toBeFocused();

			// page-list submenu closes on tab outside submenu
			await pageUtils.pressKeys( 'Enter', { delay: 50 } );
			// Tab to first element, then tab outside the submenu.
			await pageUtils.pressKeys( 'Tab', { times: 2, delay: 50 } );
			await expect( innerElement ).toBeHidden();
		} );
	} );
} );

class ColorControl {
	constructor( { admin, editor, page, pageUtils } ) {
		this.admin = admin;
		this.editor = editor;
		this.page = page;
		this.pageUtils = pageUtils;

		// Colors for readability
		this.black = 'rgb(0, 0, 0)';
		this.white = 'rgb(255, 255, 255)';
		// If there is no background color set, it will not have any background, which computes to 'rgab(0, 0, 0, 0)'.
		this.transparent = 'rgba(0, 0, 0, 0)';
	}

	async testEditorColors( {
		textColor,
		backgroundColor,
		submenuTextColor,
		submenuBackgroundColor,
	} ) {
		// Editor elements
		const customLink = this.editor.canvas
			.locator( 'a' )
			.filter( { hasText: 'Custom Link' } );
		const pageLink = this.editor.canvas
			.locator( 'a' )
			.filter( { hasText: 'Page Link' } );

		await expect( customLink ).toHaveCSS( 'color', textColor );
		await expect( pageLink ).toHaveCSS( 'color', textColor );
		// Navigation background
		const navigationWrapper = this.editor.canvas.getByRole( 'document', {
			name: 'Block: Navigation',
		} );
		await expect( navigationWrapper ).toHaveCSS(
			'background-color',
			backgroundColor
		);

		await customLink.click();

		// Submenu elements
		const submenuLink = this.editor.canvas
			.locator( 'a' )
			.filter( { hasText: 'Submenu Link' } );
		const submenuWrapper = this.editor.canvas
			.getByRole( 'document', { name: 'Block: Custom Link' } )
			.filter( { has: submenuLink } );

		// Submenu link color
		await expect( submenuLink ).toHaveCSS( 'color', submenuTextColor );

		// Submenu background color
		await expect( submenuWrapper ).toHaveCSS(
			'background-color',
			submenuBackgroundColor
		);

		// Switch to mobile view for the rest of the editor color tests
		// Focus the navigation block
		await this.editor.canvas
			.getByRole( 'document', { name: 'Block: Navigation' } )
			.click();
		await this.editor.openDocumentSettingsSidebar();
		// Switch to settings tab
		await this.page.getByRole( 'tab', { name: 'Settings' } ).click();
		// Set it to always be the mobile view, but don't save this setting so we can still check all the frontend colors
		await this.page.getByRole( 'radio', { name: 'Always' } ).click();
		await this.editor.canvas
			.getByRole( 'button', { name: 'Open menu' } )
			.click();

		const overlay = this.editor.canvas
			.locator( '.wp-block-navigation__responsive-container' )
			.filter( { hasText: 'Submenu Link' } );

		// All of the mobile menu navigation links should be the same color as the submenuTextColor
		await expect( customLink ).toHaveCSS( 'color', submenuTextColor );
		await expect( submenuLink ).toHaveCSS( 'color', submenuTextColor );
		await expect( pageLink ).toHaveCSS( 'color', submenuTextColor );

		// The mobile menu background should be the same color as the submenu background
		await expect( overlay ).toHaveCSS(
			'background-color',
			submenuBackgroundColor
		);
	}

	async testFrontendColors( {
		textColor,
		backgroundColor,
		submenuTextColor,
		submenuBackgroundColor,
	} ) {
		// Top level link elements
		const customLink = this.page
			.locator( 'a' )
			.filter( { hasText: 'Custom Link' } );
		const pageLink = this.page
			.locator( 'a' )
			.filter( { hasText: 'Page Link' } );

		// Top level link colors
		await expect( customLink ).toHaveCSS( 'color', textColor );
		await expect( pageLink ).toHaveCSS( 'color', textColor );

		// Navigation background
		const menuWrapperFront = this.page
			.getByRole( 'navigation', { name: 'Colored menu' } )
			.getByRole( 'list' );
		await expect( menuWrapperFront ).toHaveCSS(
			'background-color',
			backgroundColor
		);

		await customLink.hover();

		// Submenu elements
		const submenuLink = this.page
			.locator( 'a' )
			.filter( { hasText: 'Submenu Link' } );
		const submenuWrapper = this.page
			.locator( '.wp-block-navigation__submenu-container' )
			.filter( { has: submenuLink } );

		// Submenu link color
		await expect( submenuLink ).toHaveCSS( 'color', submenuTextColor );

		// Submenu background color
		await expect( submenuWrapper ).toHaveCSS(
			'background-color',
			submenuBackgroundColor
		);

		// Open the frontend overlay so we can test the colors
		await this.pageUtils.setBrowserViewport( { width: 599, height: 700 } );
		await this.page.getByRole( 'button', { name: 'Open menu' } ).click();

		// All of the mobile menu navigation links should be the same color as the submenuTextColor
		await expect( customLink ).toHaveCSS( 'color', submenuTextColor );
		await expect( submenuLink ).toHaveCSS( 'color', submenuTextColor );
		await expect( pageLink ).toHaveCSS( 'color', submenuTextColor );

		const overlayFront = this.page
			.locator( '.wp-block-navigation__responsive-container' )
			.filter( { hasText: 'Submenu Link' } );

		// The mobile menu background should be the same color as the submenu background
		await expect( overlayFront ).toHaveCSS(
			'background-color',
			submenuBackgroundColor
		);

		// We need to reset the overlay to the default viewport if something runs after these tests
		await this.pageUtils.setBrowserViewport( 'large' );
	}
}

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
			.locator(
				'.components-menu-item__info-wrapper .components-menu-item__item'
			) // this is the only way to get the label text without the URL.
			.innerText();
	}
}
