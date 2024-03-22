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

	test( 'creating navigation menus via keyboard without losing focus', async ( {
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
		// Wait until the nav block inserter is visible before we move on to using it
		await expect( navBlockInserter ).toBeVisible();

		/**
		 * Test: Exiting the appender from the link control returns focus to the navigation block
		 *
		 * 1. Use arrow keys to reach Appender
		 * 2. Enter to open link control
		 * 3. Escape to exit
		 * 4. Focus should be within the Navigation Block, ideally on the appender that opened it
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
		 *
		 * 1. Use arrow keys to reach Appender
		 * 2. Enter to open link control
		 * 3. Arrow down to the suggested pages
		 * 4. Enter
		 * 5. Focus should be on the newly created navigation item
		 */

		await pageUtils.pressKeys( 'ArrowDown' );

		await navigation.useBlockInserter();
		await navigation.addPage( 'Cat' );
		await navigation.previewOpenClose( {
			label: 'Cat',
			activator: 'shortcut',
		} );
		await navigation.previewOpenClose( {
			label: 'Cat',
			activator: 'toolbar',
		} );

		/**
		 * Test: Creating a link from a url-string (https://www.example.com) returns
		 *       focus to the newly created link with the text selected
		 *
		 * 1. Use arrow keys to reach Appender
		 * 2. Enter to open link control
		 * 3. Type https://www.example.com
		 * 4. Enter
		 * 5. Focus should be on the newly created navigation item with text selected
		 */

		// Move focus to the Add Block Appender.
		await page.keyboard.press( 'Escape' );
		await pageUtils.pressKeys( 'ArrowDown' );
		await pageUtils.pressKeys( 'ArrowRight', { times: 2 } );

		await navigation.useBlockInserter();
		await navigation.addCustomURL( 'https://example.com' );
		await navigation.expectToHaveTextSelected( 'example.com' );

		/**
		 * Test: Exiting the link control from the toolbar link button returns
		 *       focus to the toolbar
		 *
		 * 1. Go to toolbar link button
		 * 2. Enter
		 * 3. Focus is within the link control
		 * 4. Escape to exit
		 * 5. Focus should be on the toolbar link button
		 */
		// Move caret to beginning of nav item label
		await pageUtils.pressKeys( 'ArrowLeft' );
		await navigation.previewOpenClose( {
			label: 'example.com',
			linkName: 'Example Domain',
			activator: 'shortcut',
		} );
		await navigation.previewOpenClose( {
			label: 'example.com',
			linkName: 'Example Domain',
			activator: 'toolbar',
		} );

		/**
		 * Test: Can add submenu item using the keyboard
		 *
		 * 1. Go to toolbar add submenu button
		 * 2. Enter
		 * 3. Focus is within the link control
		 * 4. Escape to exit
		 * 5. Focus should be on the toolbar link button
		 */
		navigation.useToolbarButton( 'Add submenu' );

		// Expect the submenu Add link to be present
		await expect(
			editor.canvas.locator( 'a' ).filter( { hasText: 'Add link' } )
		).toBeVisible();

		await pageUtils.pressKeys( 'ArrowDown' );
		// There is a bug that won't allow us to press Enter to add the link: https://github.com/WordPress/gutenberg/issues/60051
		// Use Enter after that bug is resolved
		await navigation.useLinkShortcut();

		await navigation.addPage( 'Dog' );
		await navigation.previewOpenClose( {
			label: 'Dog',
			activator: 'shortcut',
		} );
		await navigation.previewOpenClose( {
			label: 'Dog',
			activator: 'toolbar',
		} );

		// Return to nav label from toolbar
		await page.keyboard.press( 'Escape' );

		// We should be at the first position on the label
		await navigation.checkLabelFocus( 'Dog' );
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

	getNavLink( label ) {
		return this.editor.canvas.locator( 'a' ).filter( { hasText: label } );
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

		const navLink = this.getNavLink( label );

		await expect( navLink ).toBeVisible();
	}

	/**
	 * Adds a custom url via the link control.
	 * Usage:
	 * - Open the new link control however you'd like (block appender, command+k on Add link label...)
	 * - Expect focus to return to the canvas with the url label highlighted
	 * @param {string} url URL you want added to the navigation
	 */
	async addCustomURL( url ) {
		await expect( this.getLinkControlSearch() ).toBeFocused();

		await this.page.keyboard.type( url, { delay: 50 } );
		await this.page.keyboard.press( 'Enter' );
	}

	/**
	 * Checks if the passed string matches the current editor selection
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
	 * Usage: Move focus to the nav block inserter. This will open and close it, and check the states.
	 * Your code will need to:
	 * 1. Place focus on the nav block appender
	 * 2. Check that focus is back where you want it.
	 */
	async addLinkClose() {
		const linkControlSearch = this.getLinkControlSearch();

		await expect( linkControlSearch ).toBeFocused();

		await this.page.keyboard.press( 'Escape' );

		await expect( linkControlSearch ).toBeHidden();
	}

	/**
	 * Checks that a label has the correct text selected
	 * Usage: Caret must be placed at the beginning of the nav label
	 * @param {string} label Nav label text
	 */
	async checkLabelFocus( label ) {
		// Select all the text
		await this.pageUtils.pressKeys( 'Shift+End' );
		await this.expectToHaveTextSelected( label );
		// Move caret back to starting position
		await this.pageUtils.pressKeys( 'ArrowLeft' );
	}

	/**
	 * Test: Exiting link control from primary+k returns
	 *       focus to the navigation block
	 *
	 * 1. Primary + k
	 * 2. Focus is within the link control
	 * 3. Escape to exit
	 * 4. Focus should be at the same position it started at
	 *
	 * @param {Object} options
	 */
	async previewOpenClose( options = {} ) {
		const { label, linkName = '', activator } = options;
		if ( activator === 'shortcut' ) {
			await this.useLinkShortcut();
		} else if ( activator === 'toolbar' ) {
			await this.useToolbarButton( 'Link' );
		} else {
			// This will fail
			return;
		}

		const linkControlLink = this.getLinkControlLink(
			linkName !== '' ? linkName : label
		);
		const navLink = this.getNavLink( label );
		await expect( navLink ).toBeVisible();

		await expect( linkControlLink ).toBeFocused();

		await this.page.keyboard.press( 'Escape' );

		await expect( linkControlLink ).toBeHidden();

		if ( activator === 'shortcut' ) {
			await this.checkLabelFocus( label );
		} else if ( activator === 'toolbar' ) {
			await expect( this.getToolbarLinkButton() ).toBeFocused();
		}
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
}
