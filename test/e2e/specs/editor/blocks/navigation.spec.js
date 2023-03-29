/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const { describe } = test;

describe( 'As a user I want the navigation block to fallback to the best possible default', () => {
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
		expect( content ).toBe(
			`<!-- wp:navigation -->
<!-- wp:page-list /-->
<!-- /wp:navigation -->`
		);
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
				'<!-- wp:navigation-link {"label":"WordPress","type":"custom","url":"http://www.wordpress.org/","kind":"custom","isTopLevelLink":true} /-->',
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
			page.locator( `role=navigation >> role=link[name="WordPress"i]` )
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
		).toBeVisible();

		// Check the block in the frontend.
		await page.goto( '/' );

		await expect(
			page.locator( `role=navigation >> role=link[name="Custom link"i]` )
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
				'<!-- wp:navigation-link {"label":"Menu 1 Link","type":"custom","url":"http://localhost:8889/#menu-1-link","kind":"custom","isTopLevelLink":true} /-->',
		} );

		//FIXME this is needed because if the two menus are created at the same time, the API will return them in the wrong order.
		//https://core.trac.wordpress.org/ticket/57914
		await editor.page.waitForTimeout( 1000 );

		const latestMenu = await requestUtils.createNavigationMenu( {
			title: 'Test Menu 2',
			content:
				'<!-- wp:navigation-link {"label":"Menu 2 Link","type":"custom","url":"http://localhost:8889/#menu-2-link","kind":"custom","isTopLevelLink":true} /-->',
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
			page.locator( `role=navigation >> role=link[name="Menu 2 Link"i]` )
		).toBeVisible();
	} );
} );

describe( 'As a user I want to create submenus using the navigation block', () => {
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
				'<!-- wp:navigation-submenu {"label":"WordPress","type":"custom","url":"http://www.wordpress.org/","kind":"custom","isTopLevelLink":true} --><!-- wp:navigation-link {"label":"WordPress Child","type":"custom","url":"http://www.wordpress.org/","kind":"custom","isTopLevelLink":true} /--><!-- /wp:navigation-submenu -->',
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

describe( 'Navigation block', () => {
	describe( 'As a user I want to see a warning if the menu referenced by a navigation block is not available', () => {
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
} );

describe( 'List view editing', () => {
	test( 'it should show a list view in the inspector controls', async ( {
		admin,
		page,
		editor,
		requestUtils,
	} ) => {
		await admin.createNewPost();
		await requestUtils.createNavigationMenu( {
			title: 'Test Menu',
			content: `<!-- wp:navigation-link {"label":"Top Level Item 1","type":"page","id":250,"url":"http://localhost:8888/quod-error-esse-nemo-corporis-rerum-repellendus/","kind":"post-type"} /-->
			<!-- wp:navigation-submenu {"label":"Top Level Item 2","type":"page","id":250,"url":"http://localhost:8888/quod-error-esse-nemo-corporis-rerum-repellendus/","kind":"post-type"} -->
				<!-- wp:navigation-link {"label":"Test Submenu Item","type":"page","id":270,"url":"http://localhost:8888/et-aspernatur-recusandae-non-sint/","kind":"post-type"} /-->
			<!-- /wp:navigation-submenu -->`,
		} );

		await editor.insertBlock( { name: 'core/navigation' } );

		await editor.openDocumentSettingsSidebar();

		const listViewTab = page.getByRole( 'tab', {
			name: 'List View',
		} );

		await listViewTab.click();

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
		await requestUtils.createNavigationMenu( {
			title: 'Test Menu',
			content: `<!-- wp:navigation-link {"label":"Top Level Item 1","type":"page","id":250,"url":"http://localhost:8888/quod-error-esse-nemo-corporis-rerum-repellendus/","kind":"post-type"} /-->
			<!-- wp:navigation-submenu {"label":"Top Level Item 2","type":"page","id":250,"url":"http://localhost:8888/quod-error-esse-nemo-corporis-rerum-repellendus/","kind":"post-type"} -->
				<!-- wp:navigation-link {"label":"Test Submenu Item","type":"page","id":270,"url":"http://localhost:8888/et-aspernatur-recusandae-non-sint/","kind":"post-type"} /-->
			<!-- /wp:navigation-submenu -->`,
		} );

		await editor.insertBlock( { name: 'core/navigation' } );

		await editor.openDocumentSettingsSidebar();

		const listViewTab = page.getByRole( 'tab', {
			name: 'List View',
		} );

		await listViewTab.click();

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
			description: 'Structure for navigation menu: Test Menu',
		} );

		// Check the structure of the individual menu items matches the one that was created.
		await expect(
			listView
				.getByRole( 'gridcell' )
				.filter( {
					hasText: 'Block 1 of 2, Level 1', // proxy for filtering by description.
				} )
				.getByText( 'Top Level Item 1' )
		).toBeVisible();

		await expect(
			listView
				.getByRole( 'gridcell' )
				.filter( {
					hasText: 'Block 2 of 2, Level 1', // proxy for filtering by description.
				} )
				.getByText( 'Top Level Item 2' )
		).toBeVisible();

		await expect(
			listView
				.getByRole( 'gridcell' )
				.filter( {
					hasText: 'Block 1 of 1, Level 2', // proxy for filtering by description.
				} )
				.getByText( 'Test Submenu Item' )
		).toBeVisible();
	} );

	test.only( `can add new menu items`, async ( {
		admin,
		page,
		editor,
		requestUtils,
	} ) => {
		await admin.createNewPost();
		await requestUtils.createNavigationMenu( {
			title: 'Test Menu',
			content: `<!-- wp:navigation-link {"label":"Top Level Item 1","type":"page","id":250,"url":"http://localhost:8888/quod-error-esse-nemo-corporis-rerum-repellendus/","kind":"post-type"} /-->
			<!-- wp:navigation-submenu {"label":"Top Level Item 2","type":"page","id":250,"url":"http://localhost:8888/quod-error-esse-nemo-corporis-rerum-repellendus/","kind":"post-type"} -->
				<!-- wp:navigation-link {"label":"Test Submenu Item","type":"page","id":270,"url":"http://localhost:8888/et-aspernatur-recusandae-non-sint/","kind":"post-type"} /-->
			<!-- /wp:navigation-submenu -->`,
		} );

		await editor.insertBlock( { name: 'core/navigation' } );

		await editor.openDocumentSettingsSidebar();

		const listViewTab = page.getByRole( 'tab', {
			name: 'List View',
		} );

		await listViewTab.click();

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

		const pageLinkBlock = blockResults.getByRole( 'option', {
			name: 'Page Link',
		} );

		await expect( pageLinkBlock ).toBeVisible();

		const customLinkBlock = blockResults.getByRole( 'option', {
			name: 'Custom Link',
		} );

		await expect( customLinkBlock ).toBeVisible();

		await pageLinkBlock.click();

		// Expect to see the Link creation UI.
		const linkUIInput = page.getByRole( 'combobox', {
			name: 'URL',
		} );

		await expect( linkUIInput ).toBeFocused();

		const linkUIResults = page.getByRole( 'listbox', {
			name: 'Recently updated',
		} );

		await expect( linkUIResults ).toBeVisible();

		// click on the first result
		const firstResult = linkUIResults.getByRole( 'option' ).nth( 0 );

		// Grab the text from the first result so we can check it was inserted.
		const firstResultText = await firstResult
			.locator( '.block-editor-link-control__search-item-title' ) // this is the only way to get the label text without the URL.
			.innerText();

		await firstResult.click();

		// check the new menu item was inserted at the end of the existing menu.
		await expect(
			listView
				.getByRole( 'gridcell', {
					name: 'Page Link link',
				} )
				.filter( {
					hasText: 'Block 3 of 3, Level 1', // proxy for filtering by description.
				} )
				.getByText( firstResultText )
		).toBeVisible();
	} );
} );
