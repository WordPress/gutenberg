/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Navigation block', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMenus();
	} );

	test.beforeAll( async ( { requestUtils } ) => {
		// We need pages to be published so the Link Control can return pages
		await requestUtils.createPage( {
			title: 'Cat',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Dog',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Walrus',
			status: 'publish',
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMenus();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test.use( {
		navigation: async ( { page, pageUtils, editor }, use ) => {
			await use( new Navigation( { page, pageUtils, editor } ) );
		},
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

			const postId = await editor.publishPost();

			// Check the markup of the block is correct.
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/navigation',
					attributes: { ref: createdMenu.id },
				},
			] );

			// Check the block in the frontend.
			await page.goto( `/?p=${ postId }` );

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

			const postId = await editor.publishPost();
			// Check the block in the frontend.
			await page.goto( `/?p=${ postId }` );

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
			const postId = await editor.publishPost();
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/navigation',
					attributes: { ref: latestMenu.id },
				},
			] );

			// Check the block in the canvas.
			await expect(
				editor.canvas.locator(
					`role=textbox[name="Navigation link text"i] >> text="Menu 2 Link"`
				)
			).toBeVisible();

			// Check the block in the frontend.
			await page.goto( `/?p=${ postId }` );

			await expect(
				page.locator(
					`role=navigation >> role=link[name="Menu 2 Link"i]`
				)
			).toBeVisible();
		} );
	} );

	test.describe( 'As a user I want to create submenus using the navigation block', () => {
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

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );

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

	test( 'As a user I want to see a warning if the menu referenced by a navigation block is not available', async ( {
		admin,
		editor,
	} ) => {
		await admin.createNewPost();

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
			.getByText( 'Navigation menu has been deleted or is unavailable.' );
		await expect( warningMessage ).toBeVisible();
	} );

	test( 'navigation manages focus for creating, editing, and deleting items', async ( {
		admin,
		page,
		pageUtils,
		editor,
		requestUtils,
		navigation,
	} ) => {
		await admin.createNewPost();

		await requestUtils.createNavigationMenu( {
			title: 'Animals',
			content: '',
		} );

		await editor.insertBlock( { name: 'core/navigation' } );

		const navBlock = navigation.getNavBlock();

		const navBlockInserter = navigation.getNavBlockInserter();
		// Wait until the nav block inserter is visible before we continue. Otherwise the navigation block may not have finished being created.
		await expect( navBlockInserter ).toBeVisible();

		/**
		 * Test: We don't lose focus when using the navigation link appender
		 */
		await pageUtils.pressKeys( 'ArrowDown' );
		await navigation.useBlockInserter();
		await navigation.addLinkClose();
		/**
		 * TODO: This is not desired behavior. Ideally the
		 * Appender should be focused again since it opened
		 * the link control.
		 * IMPORTANT: This check is not to enforce this behavior,
		 * but to make sure focus is kept nearby until we are able
		 * to send focus to the appender.
		 */
		await expect( navBlock ).toBeFocused();

		/**
		 * Test: Creating a link sends focus to the newly created navigation link item
		 */
		await pageUtils.pressKeys( 'ArrowDown' );

		await navigation.useBlockInserter();
		await navigation.addPage( 'Cat' );
		/**
		 * Test: We can open and close the preview with the keyboard and escape
		 *       buttons from a top-level nav item using both the shortcut and toolbar
		 */
		await navigation.useLinkShortcut();
		await navigation.previewIsOpenAndCloses();
		await navigation.checkLabelFocus( 'Cat' );

		await navigation.canUseToolbarLink();

		/**
		 * Test: Creating a link from a url-string (https://www.example.com) returns
		 *       focus to the newly created link with the text selected
		 */
		// Move focus to the Add Block Appender.
		await page.keyboard.press( 'Escape' );
		await pageUtils.pressKeys( 'ArrowDown' );
		await pageUtils.pressKeys( 'ArrowRight', { times: 2 } );

		await navigation.useBlockInserter();
		await navigation.addCustomURL( 'https://example.com' );
		await navigation.expectToHaveTextSelected( 'example.com' );

		/**
		 * Test: We can open and close the preview with the keyboard and escape
		 *       buttons from a top-level nav link with a url-like label using
		 *       both the shortcut and toolbar
		 */
		await pageUtils.pressKeys( 'ArrowLeft' );
		await navigation.useLinkShortcut();
		await navigation.previewIsOpenAndCloses();
		await navigation.checkLabelFocus( 'example.com' );

		await navigation.canUseToolbarLink();

		/**
		 * Test: Can add submenu item using the keyboard
		 */
		navigation.useToolbarButton( 'Add submenu' );

		// Expect the submenu Add link to be present
		await expect(
			editor.canvas.locator( 'a' ).filter( { hasText: 'Add link' } )
		).toBeVisible();

		await pageUtils.pressKeys( 'ArrowDown' );
		// There is a bug that won't allow us to press Enter to add the link: https://github.com/WordPress/gutenberg/issues/60051
		// TODO: Use Enter after that bug is resolved
		await navigation.useLinkShortcut();

		await navigation.addPage( 'Dog' );

		/**
		 * Test: We can open and close the preview with the keyboard and escape
		 *       buttons from a submenu nav item using both the shortcut and toolbar
		 */
		await navigation.useLinkShortcut();
		await navigation.previewIsOpenAndCloses();
		await navigation.checkLabelFocus( 'Dog' );

		await navigation.canUseToolbarLink();

		// Return to nav label from toolbar
		await page.keyboard.press( 'Escape' );

		// We should be at the first position on the label
		await navigation.checkLabelFocus( 'Dog' );

		/**
		 * Test: We don't lose focus when closing the submenu appender
		 */

		// Move focus to the submenu navigation appender
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'ArrowRight', { times: 2 } );
		await navigation.useBlockInserter();
		await navigation.addLinkClose();
		/**
		 * TODO: This is not desired behavior. Ideally the
		 * Appender should be focused again since it opened
		 * the link control.
		 * IMPORTANT: This check is not to enforce this behavior,
		 * but to make sure focus is kept nearby until we are able
		 * to send focus to the appender. It is falling back to the previous sibling.
		 */
		await navigation.checkLabelFocus( 'Dog' );

		/**
		 * Test: Use the submenu nav item appender to add a custom link
		 */
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'ArrowRight', { times: 2 } );
		await navigation.useBlockInserter();
		await navigation.addCustomURL( 'https://wordpress.org' );
		await navigation.expectToHaveTextSelected( 'wordpress.org' );

		/**
		 * Test: We can open and close the preview with the keyboard and escape
		 *       both the shortcut and toolbar
		 */
		await pageUtils.pressKeys( 'ArrowLeft' );
		await navigation.useLinkShortcut();
		await navigation.previewIsOpenAndCloses();
		await navigation.checkLabelFocus( 'wordpress.org' );
		await navigation.canUseToolbarLink();

		/**
		 * Test: We can open and close the preview from a submenu navigation block (the top-level parent of a submenu)
		 * using both the shortcut and toolbar
		 */
		// Exit the toolbar
		await page.keyboard.press( 'Escape' );
		// Move to the submenu item
		await pageUtils.pressKeys( 'ArrowUp', { times: 4 } );
		await page.keyboard.press( 'Home' );

		// Check we're on our submenu link
		await navigation.checkLabelFocus( 'example.com' );
		// Test the shortcut
		await navigation.useLinkShortcut();
		await navigation.previewIsOpenAndCloses();
		await navigation.checkLabelFocus( 'example.com' );
		// Test the toolbar
		await navigation.canUseToolbarLink();
		await page.keyboard.press( 'Escape' );
		await navigation.checkLabelFocus( 'example.com' );

		/**
		 * Deleting returns items focus to its sibling
		 */
		await pageUtils.pressKeys( 'ArrowDown', { times: 4 } );
		await navigation.checkLabelFocus( 'wordpress.org' );
		// Delete the nav link
		await pageUtils.pressKeys( 'access+z' );
		// Focus moved to sibling
		await navigation.checkLabelFocus( 'Dog' );
		// Add a link back so we can delete the first submenu link and see if focus returns to the parent submenu item
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'ArrowRight', { times: 2 } );
		await navigation.useBlockInserter();
		await navigation.addCustomURL( 'https://wordpress.org' );
		await navigation.expectToHaveTextSelected( 'wordpress.org' );

		await pageUtils.pressKeys( 'ArrowUp', { times: 2 } );
		await navigation.checkLabelFocus( 'Dog' );
		// Delete the nav link
		await pageUtils.pressKeys( 'access+z' );
		await pageUtils.pressKeys( 'ArrowDown' );
		// Focus moved to parent submenu item
		await navigation.checkLabelFocus( 'example.com' );
		// Deleting this should move focus to the sibling item
		await pageUtils.pressKeys( 'access+z' );
		await navigation.checkLabelFocus( 'Cat' );
		// Deleting with no more siblings should focus the navigation block again
		await pageUtils.pressKeys( 'access+z' );
		await expect( navBlock ).toBeFocused();
		// Wait until the nav block inserter is visible before we continue.
		await expect( navBlockInserter ).toBeVisible();
		// Now the appender should be visible and reachable with an arrow down
		await pageUtils.pressKeys( 'ArrowDown' );
		await expect( navBlockInserter ).toBeFocused();
	} );

	test( 'Adding new links to a navigation block with existing inner blocks triggers creation of a single Navigation Menu', async ( {
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

		// The creation Navigation Menu will be a draft
		// so we need to check for both publish and draft.
		expect(
			await requestUtils.getNavigationMenus( {
				status: [ 'publish', 'draft' ],
			} )
		).toHaveLength( 1 );
	} );
} );

class Navigation {
	constructor( { page, pageUtils, editor } ) {
		this.page = page;
		this.pageUtils = pageUtils;
		this.editor = editor;
	}

	getLinkControlLink( linkName ) {
		return this.page.getByRole( 'link', {
			name: `${ linkName } (opens in a new tab)`,
			exact: true,
		} );
	}

	getNavBlock() {
		return this.editor.canvas.getByRole( 'document', {
			name: 'Block: Navigation',
		} );
	}

	getNavBlockInserter() {
		return this.getNavBlock().getByLabel( 'Add block' );
	}

	getLinkControlSearch() {
		return this.page.getByRole( 'combobox', {
			name: 'Link',
		} );
	}

	getToolbarLinkButton() {
		return this.page.getByRole( 'button', {
			name: 'Link',
			exact: true,
		} );
	}

	async useBlockInserter() {
		const navBlockInserter = this.getNavBlockInserter();

		// Wait until the nav block inserter is visible before we move on to using it
		await expect( navBlockInserter ).toBeVisible();

		await expect( navBlockInserter ).toBeFocused();

		await this.page.keyboard.press( 'Enter' );
	}

	async useLinkShortcut() {
		await this.pageUtils.pressKeys( 'primary+k' );
	}

	/**
	 * Moves focus to the toolbar and arrows to the button and activates it.
	 *
	 * @param {string} name the name of the toolbar button
	 */
	async useToolbarButton( name ) {
		await this.pageUtils.pressKeys( 'alt+F10' );
		await this.arrowToLabel( name );
		await expect(
			this.page.getByRole( 'button', {
				name,
				exact: true,
			} )
		).toBeFocused();

		await this.page.keyboard.press( 'Enter' );
	}

	/**
	 * Adds a page via the link control and closes it.
	 * Usage:
	 * - Open the new link control however you'd like (block appender, command+k on Add link label...)
	 *
	 * @param {string} label Text of page you want added. Must be a part of the pages added in the beforeAll in this test suite.
	 */
	async addPage( label ) {
		const linkControlSearch = this.page.getByRole( 'combobox', {
			name: 'Link',
		} );

		await expect( linkControlSearch ).toBeFocused();

		await this.page.keyboard.type( label, { delay: 50 } );

		await this.pageUtils.pressKeys( 'ArrowDown' );

		await this.page.keyboard.press( 'Enter' );

		const linkControlLink = await this.getLinkControlLink( label );
		await expect( linkControlLink ).toBeFocused();

		await this.page.keyboard.press( 'Escape' );

		await expect( linkControlSearch ).toBeHidden();

		await this.checkLabelFocus( label );
	}

	/**
	 * Adds a custom url via the link control.
	 * Usage:
	 * - Open the new link control however you'd like (block appender, command+k on Add link label...)
	 * - Expect focus to return to the canvas with the url label highlighted
	 *
	 * @param {string} url URL you want added to the navigation
	 */
	async addCustomURL( url ) {
		await expect( this.getLinkControlSearch() ).toBeFocused();

		await this.page.keyboard.type( url, { delay: 50 } );
		await this.page.keyboard.press( 'Enter' );
	}

	/**
	 * Checks if the passed string matches the current editor selection
	 *
	 * @param {string} text Text you want to see if it's selected
	 */
	async expectToHaveTextSelected( text ) {
		expect(
			await this.editor.canvas
				.locator( ':root' )
				.evaluate( () => window.getSelection().toString() )
		).toBe( text );
	}

	/**
	 * Closes the new link popover when used from the block appender
	 */
	async addLinkClose() {
		const linkControlSearch = this.getLinkControlSearch();

		await expect( linkControlSearch ).toBeFocused();

		await this.page.keyboard.press( 'Escape' );

		await expect( linkControlSearch ).toBeHidden();
	}

	/**
	 * Checks that we are focused on a specific navigation item.
	 * It will return the caret to the beginning of the item.
	 *
	 * @param {string} label Nav label text
	 */
	async checkLabelFocus( label ) {
		await this.page.keyboard.press( 'Home' );
		// Select all the text
		await this.pageUtils.pressKeys( 'Shift+End' );
		await this.expectToHaveTextSelected( label );
		// Move caret back to starting position
		await this.pageUtils.pressKeys( 'ArrowLeft' );
	}

	/**
	 * Checks:
	 * - the preview is open
	 * - has focus within it
	 * - closes with Escape
	 * - The popover is now hidden
	 */
	async previewIsOpenAndCloses() {
		const linkPopover = this.getLinkPopover();
		await expect( linkPopover ).toBeVisible();
		// Expect focus to be within the link control. We could be more exact here, but it would be more brittle that way. We really care if focus is within it or not.
		expect(
			await this.page.evaluate( () => {
				const { activeElement } =
					document.activeElement?.contentDocument ?? document;
				return !! activeElement.closest(
					'.components-popover__content .block-editor-link-control'
				);
			} )
		).toBe( true );

		await this.page.keyboard.press( 'Escape' );

		await expect( linkPopover ).toBeHidden();
	}

	/**
	 * When focus is within a navigation link item, we should be able to:
	 * - use the toolbar link button to open the popover
	 * - have focus within the popover
	 * - close it usingn escape to return focus to the toolbar button
	 */
	async canUseToolbarLink() {
		await this.useToolbarButton( 'Link' );
		await this.previewIsOpenAndCloses();
		await expect( this.getToolbarLinkButton() ).toBeFocused();
	}

	async arrowToLabel( label, times = 15 ) {
		for ( let i = 0; i < times; i++ ) {
			await this.pageUtils.pressKeys( 'ArrowRight' );
			const activeLabel = await this.page.evaluate( () => {
				return (
					document.activeElement.getAttribute( 'aria-label' ) ||
					document.activeElement.textContent
				);
			} );
			if ( activeLabel === label ) {
				return;
			}
		}
	}

	/**
	 * This method is used as a temporary workaround for retriveing the
	 * LinkControl component. This is because it currently does not expose
	 * any accessible attributes. In general we should avoid using this method
	 * and instead rely on locating the sub elements of the component directly.
	 * Remove / update method once the following PR has landed:
	 * https://github.com/WordPress/gutenberg/pull/54063.
	 */
	getLinkPopover() {
		return this.page.locator(
			'.components-popover__content .block-editor-link-control'
		);
	}
}
