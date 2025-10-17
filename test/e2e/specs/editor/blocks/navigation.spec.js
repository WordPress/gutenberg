/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Navigation block', () => {
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMenus();
	} );

	test.use( {
		navigation: async ( { page, pageUtils, editor }, use ) => {
			await use( new Navigation( { page, pageUtils, editor } ) );
		},
	} );

	test.describe( 'As a user I want the navigation block to fallback to the best possible default', () => {
		test.afterEach( async ( { requestUtils } ) => {
			await Promise.all( [
				requestUtils.deleteAllPosts(),
				requestUtils.deleteAllPages(),
				requestUtils.deleteAllMenus(),
			] );
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
			await page.keyboard.type( '#yup' );
			await page.keyboard.press( 'Enter' );

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
			.getByText( 'Navigation Menu has been deleted or is unavailable.' );
		await expect( warningMessage ).toBeVisible();
	} );

	test.describe( 'Focus management', () => {
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

		test.beforeEach(
			async ( { admin, editor, requestUtils, navigation } ) => {
				await admin.createNewPost();

				await requestUtils.createNavigationMenu( {
					title: 'Animals',
					content: '',
				} );

				await editor.insertBlock( { name: 'core/navigation' } );

				const navBlockInserter = navigation.getNavBlockInserter();
				// Wait until the nav block inserter is visible before we continue. Otherwise the navigation block may not have finished being created.
				await expect( navBlockInserter ).toBeVisible();
			}
		);

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllMenus();
		} );

		test( 'Focus management when using the navigation link appender', async ( {
			pageUtils,
			navigation,
			page,
		} ) => {
			const navBlockInserter = navigation.getNavBlockInserter();

			await test.step( 'with no links, focus returns to the top level navigation link appender if we close the Link UI without creating a link', async () => {
				await pageUtils.pressKeys( 'ArrowDown' );
				await navigation.useBlockInserter();
				await navigation.addLinkClose();

				await expect( navBlockInserter ).toBeVisible();
				await expect( navBlockInserter ).toBeFocused();
			} );

			await test.step( 'creating a link sends focus to the newly created navigation link item', async () => {
				await pageUtils.pressKeys( 'ArrowDown' );
				await navigation.useBlockInserter();
				await navigation.addPage( 'Cat' );
			} );

			await test.step( 'can use the shortcut to open the preview with the keyboard and escape keypress sends focus back to the navigation link block', async () => {
				await navigation.useLinkShortcut();
				await navigation.previewIsOpenAndCloses();
				await navigation.checkLabelFocus( 'Cat' );
			} );

			await test.step( 'can use the toolbar link to open the preview and escape keypress sends focus back to the toolbar link button', async () => {
				await navigation.canUseToolbarLink();

				await page.keyboard.press( 'Escape' );
			} );

			await pageUtils.pressKeys( 'ArrowDown' );
			await pageUtils.pressKeys( 'ArrowRight', { times: 2 } );

			await test.step( 'focus returns to the navigation link appender if we close the Link UI without creating a link', async () => {
				await navigation.useBlockInserter();
				await navigation.addLinkClose();
				await expect( navBlockInserter ).toBeVisible();
				await expect( navBlockInserter ).toBeFocused();
			} );

			await test.step( 'creating a link from a url-string (https://www.example.com) returns focus to the newly created link with the text selected', async () => {
				await navigation.useBlockInserter();
				await navigation.addCustomURL( 'https://example.com' );
				await navigation.expectToHaveTextSelected( 'example.com' );
			} );

			await test.step( 'we can open and close the preview with the keyboard and escape buttons from a top-level nav link with a url-like label using both the shortcut and toolbar', async () => {
				await pageUtils.pressKeys( 'ArrowLeft' );
				await navigation.useLinkShortcut();
				await navigation.previewIsOpenAndCloses();
				await navigation.checkLabelFocus( 'example.com' );

				await navigation.canUseToolbarLink();
			} );
		} );

		test( 'Can add submenu item using the keyboard', async ( {
			editor,
			pageUtils,
			navigation,
			page,
		} ) => {
			await test.step( 'create a top level navigation link', async () => {
				await pageUtils.pressKeys( 'ArrowDown' );
				await navigation.useBlockInserter();
				await navigation.addPage( 'Cat' );
			} );

			await test.step( 'can add submenu item using the keyboard', async () => {
				navigation.useToolbarButton( 'Add submenu' );

				// Expect the submenu Add link to be present
				await expect(
					editor.canvas
						.locator( 'a' )
						.filter( { hasText: 'Add link' } )
				).toBeVisible();

				await pageUtils.pressKeys( 'ArrowDown' );
				// There is a bug that won't allow us to press Enter to add the link: https://github.com/WordPress/gutenberg/issues/60051
				// TODO: Use Enter after that bug is resolved
				await navigation.useLinkShortcut();

				await navigation.addPage( 'Dog' );
			} );

			await test.step( 'can use the shortcut to open the preview with the keyboard and escape keypress sends focus back to the navigation link block in the submenu', async () => {
				await navigation.useLinkShortcut();
				await navigation.previewIsOpenAndCloses();
				await navigation.checkLabelFocus( 'Dog' );
			} );

			await test.step( 'can use the toolbar link to open the preview and escape keypress sends focus back to the toolbar link button', async () => {
				await navigation.canUseToolbarLink();

				// Return to nav label from toolbar
				await page.keyboard.press( 'Escape' );

				// We should be at the first position on the label
				await navigation.checkLabelFocus( 'Dog' );
			} );

			await test.step( 'focus returns to the submenu appender when exiting the submenu link creation without creating a link', async () => {
				// Move focus to the submenu navigation appender
				await page.keyboard.press( 'End' );
				await pageUtils.pressKeys( 'ArrowRight', { times: 2 } );

				await pageUtils.pressKeys( 'ArrowDown' );

				// Use the submenu block inserter
				const navBlock = navigation.getNavBlock();
				const submenuBlock = navBlock.getByRole( 'document', {
					name: 'Block: Submenu',
				} );

				const submenuBlockInserter =
					submenuBlock.getByLabel( 'Add block' );
				await expect( submenuBlockInserter ).toBeVisible();
				await expect( submenuBlockInserter ).toBeFocused();

				await page.keyboard.press( 'Enter' );

				await navigation.addLinkClose();

				await expect( submenuBlockInserter ).toBeVisible();
				await expect( submenuBlockInserter ).toBeFocused();
			} );
		} );

		test( 'Can add submenu item(custom-link) using the keyboard', async ( {
			page,
			pageUtils,
			navigation,
			editor,
		} ) => {
			await pageUtils.pressKeys( 'ArrowDown' );
			await navigation.useBlockInserter();
			await navigation.addPage( 'Cat' );

			/**
			 * Test: Can add submenu item(custome-link) using the keyboard
			 */
			navigation.useToolbarButton( 'Add submenu' );

			// Expect the submenu Add link to be present
			await expect(
				editor.canvas.locator( 'a' ).filter( { hasText: 'Add link' } )
			).toBeVisible();

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
			await pageUtils.pressKeys( 'ArrowUp', { times: 2 } );
			await page.keyboard.press( 'Home' );

			// Check we're on our submenu link
			await navigation.checkLabelFocus( 'Cat' );
			// Test the shortcut
			await navigation.useLinkShortcut();
			await navigation.previewIsOpenAndCloses();

			await navigation.checkLabelFocus( 'Cat' );

			// Test the toolbar
			await navigation.canUseToolbarLink();
			await page.keyboard.press( 'Escape' );
			await navigation.checkLabelFocus( 'Cat' );
		} );

		test( 'Deleting items', async ( {
			page,
			pageUtils,
			navigation,
			editor,
		} ) => {
			// Add top-level nav items.
			await pageUtils.pressKeys( 'ArrowDown' );
			await navigation.useBlockInserter();
			await navigation.addPage( 'Cat' );
			await pageUtils.pressKeys( 'ArrowDown' );
			await pageUtils.pressKeys( 'ArrowRight', { times: 2 } );
			await navigation.useBlockInserter();
			await navigation.addCustomURL( 'https://example.com' );
			await navigation.expectToHaveTextSelected( 'example.com' );

			// Add submenu items.
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
			await page.keyboard.press( 'End' );
			await pageUtils.pressKeys( 'ArrowRight', { times: 2 } );
			await navigation.useBlockInserter();
			await navigation.addCustomURL( 'https://wordpress.org' );
			await navigation.expectToHaveTextSelected( 'wordpress.org' );

			/**
			 * Test: Deleting second item returns focus to its sibling
			 */
			await pageUtils.pressKeys( 'access+z' );
			await navigation.checkLabelFocus( 'Dog' );

			/**
			 * Test: Deleting first item returns focus to the parent submenu item
			 */
			// Add a link back so we can delete the first submenu link.
			await page.keyboard.press( 'End' );
			await pageUtils.pressKeys( 'ArrowRight', { times: 2 } );
			await navigation.useBlockInserter();
			await navigation.addCustomURL( 'https://wordpress.org' );
			await navigation.expectToHaveTextSelected( 'wordpress.org' );

			await pageUtils.pressKeys( 'ArrowUp', { times: 2 } );
			await navigation.checkLabelFocus( 'Dog' );
			await pageUtils.pressKeys( 'ArrowUp', { times: 1 } );
			await pageUtils.pressKeys( 'access+z' );
			await pageUtils.pressKeys( 'ArrowDown' );
			await navigation.checkLabelFocus( 'example.com' );

			/**
			 * Test: Deleting top-level second item returns focus to its sibling
			 */
			await pageUtils.pressKeys( 'access+z' );
			await navigation.checkLabelFocus( 'Cat' );

			/**
			 * Test: Deleting with no more siblings should focus the navigation block again
			 */
			await pageUtils.pressKeys( 'access+z' );
			await expect( navigation.getNavBlock() ).toBeFocused();
			// Wait until the nav block inserter is visible before we continue.
			await expect( navigation.getNavBlockInserter() ).toBeVisible();
			// Now the appender should be visible and reachable with an arrow down
			await pageUtils.pressKeys( 'ArrowDown' );
			await expect( navigation.getNavBlockInserter() ).toBeFocused();
		} );

		test( 'should preserve focus in sidebar text input when typing (@firefox)', async ( {
			page,
			editor,
			requestUtils,
			pageUtils,
		} ) => {
			// Create a navigation menu with one link
			const createdMenu = await requestUtils.createNavigationMenu( {
				title: 'Test Menu',
				content: `<!-- wp:navigation-link {"label":"Home","url":"https://example.com"} /-->`,
			} );

			// Insert the navigation block
			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: {
					ref: createdMenu?.id,
				},
			} );

			// Click on the navigation link label in the canvas to edit it
			const linkLabel = editor.canvas.getByRole( 'textbox', {
				name: 'Navigation link text',
			} );
			await linkLabel.click();
			await pageUtils.pressKeys( 'primary+a' );
			await page.keyboard.type( 'Updated Home' );

			// Open the document settings sidebar
			await editor.openDocumentSettingsSidebar();

			// Tab to the sidebar settings panel
			// First tab should go to the settings sidebar
			await page.keyboard.press( 'Tab' );

			// Find the text input in the sidebar
			const textInput = page.getByRole( 'textbox', {
				name: 'Text',
			} );

			// Tab until we reach the Text field in the sidebar
			// This may take multiple tabs depending on other controls
			for ( let i = 0; i < 10; i++ ) {
				const focusedElement = await page.evaluate( () => {
					const el = document.activeElement;
					return {
						tagName: el?.tagName,
						label:
							el?.getAttribute( 'aria-label' ) ||
							el?.labels?.[ 0 ]?.textContent,
						id: el?.id,
					};
				} );

				if (
					focusedElement.label?.includes( 'Text' ) &&
					focusedElement.tagName === 'INPUT'
				) {
					break;
				}

				await page.keyboard.press( 'Tab' );
			}

			await expect( textInput ).toBeFocused();
			await pageUtils.pressKeys( 'ArrowRight' );
			// Type in the sidebar text input
			await page.keyboard.type( ' Extra' );

			// Verify the text was actually typed (change happened)
			await expect( textInput ).toHaveValue( 'Updated Home Extra' );

			// Tab again to move to the next field
			await page.keyboard.press( 'Tab' );

			// Check that focus is still within the document sidebar
			const focusIsInSidebar = await page.evaluate( () => {
				const activeEl = document.activeElement;
				const sidebar = document.querySelector(
					'.interface-interface-skeleton__sidebar'
				);
				return sidebar?.contains( activeEl );
			} );

			expect( focusIsInSidebar ).toBe( true );
		} );
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

	test.describe( 'Navigation Link Entity bindings', () => {
		// eslint-disable-next-line no-unused-vars
		let testPage1, testPage2, testPage3;

		test.beforeEach( async ( { admin, page, requestUtils } ) => {
			// Enable pretty permalinks by navigating to Settings > Permalinks
			// TODO: Encapsulate permalink setup in an admin.setPermalinks( '/%postname%/' ) style util
			// We need to run this in beforeEach instead of beforeAll since we don't have page context
			// in beforeAll
			await admin.visitAdminPage( 'options-permalink.php' );

			// Select the Post name permalink structure (/%postname%/)
			await page.click( '#permalink-input-post-name' );

			// Click Save Changes
			await page.click( '#submit' );

			// Wait for settings to be saved
			await page.waitForSelector( '.notice-success' );

			// Force re-discovery of REST API root URL after enabling pretty permalinks.
			// When permalinks change from plain to pretty, the REST API URL changes
			// from /?rest_route=/ to /wp-json/. We need to refresh the cached URL
			// to prevent 404 errors.
			await requestUtils.setupRest();

			// Create test pages
			testPage1 = await requestUtils.createPage( {
				title: 'Test Page 1',
				status: 'publish',
			} );

			testPage2 = await requestUtils.createPage( {
				title: 'Test Page 2',
				status: 'publish',
			} );

			testPage3 = await requestUtils.createPage( {
				title: 'Test Page 3',
				status: 'publish',
			} );
		} );

		test.afterEach( async ( { admin, page, requestUtils } ) => {
			await requestUtils.deleteAllPages();

			// Restore plain permalinks
			// TODO: Encapsulate permalink teardown in an admin.setPermalinks( '' ) style util
			// We need to run this in afterEach instead of afterAll since we don't have page context
			// in afterAll
			await admin.visitAdminPage( 'options-permalink.php' );

			// Select Plain permalinks
			await page.click( '#permalink-input-plain' );

			// Click Save Changes
			await page.click( '#submit' );

			// Wait for settings to be saved
			await page.waitForSelector( '.notice-success' );

			// Force re-discovery of REST API root URL after disabling pretty permalinks.
			// When permalinks change from pretty to plain, the REST API URL changes
			// from /wp-json/ back to /?rest_route=/. We need to refresh the cached URL
			// to prevent 404 errors.
			await requestUtils.setupRest();
		} );

		test( 'can bind to a page', async ( {
			editor,
			page,
			admin,
			navigation,
			requestUtils,
			pageUtils,
		} ) => {
			let postId, updatedPage;

			await test.step( 'Setup - Create menu and navigation block with bound page link', async () => {
				await admin.createNewPost();

				// create an empty menu for use - avoids Page List block
				const menu = await requestUtils.createNavigationMenu( {
					title: 'Test Menu',
					content: '',
				} );

				await editor.insertBlock( {
					name: 'core/navigation',
					attributes: {
						ref: menu.id,
					},
				} );

				// Insert a link to a Page
				await expect( navigation.getNavBlockInserter() ).toBeVisible();
				await pageUtils.pressKeys( 'ArrowDown' );
				await navigation.useBlockInserter();
				await navigation.addPage( 'Test Page 1' );
			} );

			await test.step( 'Verify bound link displays correctly in Link UI popover', async () => {
				// Open Link UI via keyboard shortcut
				await pageUtils.pressKeys( 'primary+k' );

				const linkPopover = navigation.getLinkPopover();
				await expect( linkPopover ).toBeVisible();

				// Click Edit button to see form fields
				await linkPopover
					.getByRole( 'button', { name: 'Edit' } )
					.click();

				// Check Link field is disabled with correct URL
				const linkInput = linkPopover.getByRole( 'combobox', {
					name: 'Link',
				} );
				await expect( linkInput ).toBeDisabled();
				await expect( linkInput ).toHaveValue( testPage1.link );

				// Check help text
				await expect(
					linkPopover.getByText( 'Synced with the selected page.' )
				).toBeVisible();

				// Close Link UI
				await page.keyboard.press( 'Escape' );
				await expect( linkPopover ).toBeHidden();
			} );

			await test.step( 'Verify bound link displays correctly in sidebar', async () => {
				// Check the Inspector controls for the Nav Link block
				// to verify the Link field is:
				// - disabled
				// - has the correct URL matching the page URL
				// - has the correct help text (description)
				await editor.openDocumentSettingsSidebar();
				const settingsControls = page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'tabpanel', { name: 'Settings' } );

				await expect( settingsControls ).toBeVisible();

				const linkInput = settingsControls.getByRole( 'textbox', {
					name: 'Link',
					description: 'Synced with the selected page',
				} );

				await expect( linkInput ).toBeDisabled();
				await expect( linkInput ).toHaveValue( testPage1.link );
			} );

			await test.step( 'Verify bound link works correctly on frontend', async () => {
				// Save the Post and check frontend
				postId = await editor.publishPost();

				// Navigate to the frontend post page
				await page.goto( `/?p=${ postId }` );

				// Verify the navigation link on the frontend has the correct URL
				const frontendLink = page.getByRole( 'link', {
					name: 'Test Page 1',
				} );
				await expect( frontendLink ).toHaveAttribute(
					'href',
					testPage1.link
				);
			} );

			await test.step( 'Update page slug and verify frontend reflects change', async () => {
				const updatedPageSlug = 'page-1-changed';
				// Update the page slug via REST API
				updatedPage = await requestUtils.rest( {
					method: 'PUT',
					path: `/wp/v2/pages/${ testPage1.id }`,
					data: {
						slug: updatedPageSlug,
					},
				} );

				expect( updatedPage.link ).toContain( `/${ updatedPageSlug }` );

				// Check that the frontend immediately shows the updated URL
				await page.goto( `/?p=${ postId }` );

				const updatedFrontendLink = page.getByRole( 'link', {
					name: 'Test Page 1',
				} );
				await expect( updatedFrontendLink ).toHaveAttribute(
					'href',
					updatedPage.link
				);

				// Verify the link goes to the correct page
				await updatedFrontendLink.click();
				await expect( page ).toHaveURL( updatedPage.link );

				// Verify the page content is correct
				await expect(
					page.getByRole( 'heading', { name: 'Test Page 1' } )
				).toBeVisible();
			} );

			await test.step( 'Verify editor sidebar reflects updated page URL', async () => {
				// Now check that the editor also shows the updated URL
				await admin.editPost( postId );

				// Wait for and select the Navigation block first
				const navBlock = navigation.getNavBlock();
				await expect( navBlock ).toBeVisible();
				await editor.selectBlocks( navBlock );

				// Then select the Navigation Link block
				const navLinkBlock = navBlock
					.getByRole( 'document', {
						name: 'Block: Page Link',
					} )
					.first(); // there is a draggable ghost block so we need to select the actual block!

				await expect( navLinkBlock ).toBeVisible( {
					// Wait for the Navigation Link block to be available
					timeout: 1000,
				} );
				await editor.selectBlocks( navLinkBlock );

				// Check that the link input now shows the updated URL
				await editor.openDocumentSettingsSidebar();
				const updatedLinkInput = page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByRole( 'textbox', {
						name: 'Link',
						description: 'Synced with the selected page',
					} );

				await expect( updatedLinkInput ).toHaveValue(
					updatedPage.link
				);
			} );

			await test.step( 'Verify Link UI popover also reflects updated page URL', async () => {
				// Open Link UI via keyboard shortcut
				await pageUtils.pressKeys( 'primary+k' );

				const linkPopover = navigation.getLinkPopover();
				await expect( linkPopover ).toBeVisible();

				// Click Edit button to see form fields
				await linkPopover
					.getByRole( 'button', { name: 'Edit' } )
					.click();

				// Check Link field shows updated URL
				const linkInput = linkPopover.getByRole( 'combobox', {
					name: 'Link',
				} );
				await expect( linkInput ).toBeDisabled();
				await expect( linkInput ).toHaveValue( updatedPage.link );

				// Close Link UI
				await page.keyboard.press( 'Escape' );
				await expect( linkPopover ).toBeHidden();
			} );

			await test.step( 'Verify unsync button works in Link UI popover', async () => {
				// Open Link UI via keyboard shortcut
				await pageUtils.pressKeys( 'primary+k' );

				const linkPopover = navigation.getLinkPopover();
				await expect( linkPopover ).toBeVisible();

				// Click Edit button
				await linkPopover
					.getByRole( 'button', { name: 'Edit' } )
					.click();

				const linkInput = linkPopover.getByRole( 'combobox', {
					name: 'Link',
				} );

				// Find and click unsync button
				const unsyncButton = linkPopover.getByRole( 'button', {
					name: 'Unsync and edit',
				} );
				await unsyncButton.click();

				// Verify Link field becomes enabled
				await expect( linkInput ).toBeEnabled();

				// Cancel to preserve bound state for sidebar tests
				await linkPopover
					.getByRole( 'button', { name: 'Cancel' } )
					.click();

				// Pressing Escape closes the popover
				await page.keyboard.press( 'Escape' );
				await expect( linkPopover ).toBeHidden();
			} );

			await test.step( 'Verify unsync button works in sidebar', async () => {
				// Get the sidebar controls
				const settingsControls = page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'tabpanel', { name: 'Settings' } );

				const linkInput = settingsControls.getByRole( 'textbox', {
					name: 'Link',
					description: 'Synced with the selected page',
				} );

				// Find the button using its name and aria-describedby ID
				// The button has aria-describedby pointing to the help text element
				const helpTextId =
					await linkInput.getAttribute( 'aria-describedby' );
				const unlinkButton = settingsControls.getByRole( 'button', {
					name: 'Unsync and edit',
					description: helpTextId,
				} );
				await unlinkButton.click();
				await expect( linkInput ).toBeEnabled();
				await expect( linkInput ).toHaveValue( '' );
			} );
		} );

		test( 'existing links with id but no binding remain editable', async ( {
			editor,
			page,
			admin,
			navigation,
			requestUtils,
		} ) => {
			await admin.createNewPost();

			// Create a menu with an existing link that has id but no binding
			// This simulates existing sites before the binding feature
			const menu = await requestUtils.createNavigationMenu( {
				title: 'Test Menu',
				content: `<!-- wp:navigation-link {"label":"Support","type":"page","id":${ testPage1.id },"url":"${ testPage1.link }","kind":"post-type"} /-->`,
			} );

			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: {
					ref: menu.id,
				},
			} );

			// Select the Navigation Link block
			const navBlock = navigation.getNavBlock();
			await editor.selectBlocks( navBlock );

			const navLinkBlock = navBlock
				.getByRole( 'document', {
					name: 'Block: Page Link',
				} )
				.first();

			await editor.selectBlocks( navLinkBlock );

			// Check the Inspector controls for the Nav Link block
			// to verify the Link field is enabled (not locked in entity mode)
			await editor.openDocumentSettingsSidebar();
			const settingsControls = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'tabpanel', { name: 'Settings' } );

			await expect( settingsControls ).toBeVisible();

			const linkInput = settingsControls.getByRole( 'textbox', {
				name: 'Link',
			} );

			// For existing links with id but no binding, the input should be enabled
			await expect( linkInput ).toBeEnabled();
			await expect( linkInput ).toHaveValue( testPage1.link );
		} );
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
		return this.getNavBlock().getByLabel( 'Add block' ).first();
	}

	getLinkControlSearch() {
		return this.page.getByRole( 'combobox', {
			name: 'Search or type URL',
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
			name: 'Search or type URL',
		} );

		await expect( linkControlSearch ).toBeFocused();

		await this.page.keyboard.type( label, { delay: 50 } );

		// Wait for the search results to be visible
		await expect(
			this.page.getByRole( 'listbox', {
				name: 'Search results',
			} )
		).toBeVisible();

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

		// Wait for focus to be within the link control
		// We could be more exact here, but it would be more brittle that way. We really care if focus is within it or not.
		await expect
			.poll(
				async () => {
					return await this.page.evaluate( () => {
						const { activeElement } =
							document.activeElement?.contentDocument ?? document;
						return !! activeElement.closest(
							'.components-popover__content .block-editor-link-control'
						);
					} );
				},
				{
					message: 'Focus should be within the link control',
					timeout: 500,
				}
			)
			.toBe( true );

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
