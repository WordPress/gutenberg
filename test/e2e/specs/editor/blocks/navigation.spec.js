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

			const navBlockInserter = editor.canvas
				.getByRole( 'document', { name: 'Block: Navigation' } )
				.getByRole( 'button', { name: 'Add page' } );
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
		let catPage, dogPage;

		test.beforeAll( async ( { requestUtils } ) => {
			// We need pages to be published so the Link Control can return pages
			catPage = await requestUtils.createPage( {
				title: 'Cat',
				status: 'publish',
			} );
			dogPage = await requestUtils.createPage( {
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
				await pageUtils.pressKeys( 'ArrowLeft', { times: 2 } );
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
				// The link UI should be closed when creating a custom link
				await expect( navigation.getLinkPopover() ).toBeHidden();
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

				await navigation.addSubmenuPage( 'Dog' );
				// Navigate to the Dog link content using ArrowLeft (ArrowUp skips
				// blocks with nested focusables).
				await pageUtils.pressKeys( 'ArrowLeft', { times: 2 } );
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
					submenuBlock.getByLabel( 'Add page' );
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
			// Move to the submenu item (only one ArrowUp needed - skips the
			// submenu wrapper directly to Cat's content)
			await page.keyboard.press( 'ArrowUp' );
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

			// One ArrowUp to get to Dog (skips wrapper)
			await page.keyboard.press( 'ArrowUp' );
			await navigation.checkLabelFocus( 'Dog' );
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

		test( 'Selecting a new block from another link with a popover open should respect the new block selection', async ( {
			editor,
			page,
			pageUtils,
			navigation,
			requestUtils,
		} ) => {
			let inspectorNavigationLabel,
				catLinkText,
				dogLinkText,
				linkPopover,
				unavailableLinkText;

			// Test setup step
			await test.step( 'Test setup', async () => {
				const nonExistentPageId = 99999;
				// Create a menu with three links:
				// 1. Invalid synced link (deleted page)
				// 2. Valid synced link (Cat page)
				// 3. Valid synced link (Dog page)
				// 4. Custom URL link (example.com)
				const menu = await requestUtils.createNavigationMenu( {
					title: 'Test Menu with Unavailable Entity, Synced Cat Page, and Custom URL',
					content: `<!-- wp:navigation-link {"label":"Unavailable Page","type":"page","id":${ nonExistentPageId },"kind":"post-type","metadata":{"bindings":{"url":{"source":"core/post-data","args":{"field":"link"}}}}} /-->
<!-- wp:navigation-link {"label":"Cat","type":"page","id":${ catPage.id },"url":"${ catPage.link }","kind":"post-type","metadata":{"bindings":{"url":{"source":"core/post-data","args":{"field":"link"}}}}} /-->
<!-- wp:navigation-link {"label":"Dog","type":"page","id":${ dogPage.id },"url":"${ dogPage.link }","kind":"post-type","metadata":{"bindings":{"url":{"source":"core/post-data","args":{"field":"link"}}}}} /-->
<!-- wp:navigation-link {"label":"example.com","url":"http://example.com","kind":"custom","isTopLevelLink":true} /-->`,
				} );

				await editor.insertBlock( {
					name: 'core/navigation',
					attributes: {
						ref: menu.id,
					},
				} );

				// Open the insepctor sidebar, as this is the easiest way to visually see block selection
				await editor.openDocumentSettingsSidebar();

				// CRITICAL: Wait for synced link entities to load BEFORE interacting with them
				// Synced links load their URLs asynchronously. If we click them before the URLs
				// are loaded, the popover opens in edit mode (url: null) instead of preview mode.
				// Select the Cat link temporarily to check if its URL is loaded in the sidebar.
				catLinkText = editor.canvas
					.getByRole( 'textbox', {
						name: 'Navigation link text',
					} )
					.filter( { hasText: /^Cat$/ } );
				await catLinkText.click();

				// With LinkControlInspector, check that link button shows the page info
				const linkButton = page
					.getByRole( 'tabpanel', { name: 'Content' } )
					.getByRole( 'button', { name: /Cat/i } );

				// Wait for the Cat link to load in the button
				await expect( linkButton ).toContainText( 'Cat' );
				// Button is enabled even for synced links
				await expect( linkButton ).toBeEnabled();
			} );

			await test.step( 'Popover closing from unsynced link to a synced link should not steal focus back to the previously selected (Cat) link', async () => {
				// Cat link is already selected from setup step, with entity loaded
				// Verify sidebar shows Cat
				inspectorNavigationLabel = page
					.getByRole( 'tabpanel', { name: 'Content' } )
					.getByRole( 'textbox', {
						name: 'Text',
					} );
				await expect( inspectorNavigationLabel ).toHaveValue( 'Cat' );

				await pageUtils.pressKeys( 'primary+k' );
				linkPopover = navigation.getLinkPopover();
				await expect( linkPopover ).toBeVisible();
				const catPopoverLink = navigation.getLinkControlLink( 'Cat' );
				await expect( catPopoverLink ).toBeVisible();

				// Check that the popover has focus on the Cat link
				await expect( catPopoverLink ).toBeFocused();

				dogLinkText = editor.canvas
					.getByRole( 'textbox', {
						name: 'Navigation link text',
					} )
					.filter( { hasText: 'Dog' } );
				await dogLinkText.click();

				// Verify the popover is closed
				await expect( linkPopover ).toBeHidden();
				// Check that the Label in the inspector sidebar is Dog
				await expect( inspectorNavigationLabel ).toHaveValue( 'Dog' );
			} );

			await test.step( 'Popover closing from synced (Dog) link to an unsynced link should not steal focus back to the previously selected (Dog) link', async () => {
				await pageUtils.pressKeys( 'primary+k' );
				await expect( linkPopover ).toBeVisible();

				const dogPopoverLink = navigation.getLinkControlLink( 'Dog' );
				await expect( dogPopoverLink ).toBeVisible();

				// Check that the popover has focus on the Cat link
				await expect( dogPopoverLink ).toBeFocused();

				unavailableLinkText = editor.canvas
					.locator( 'a' )
					.filter( { hasText: 'Unavailable Page (Invalid)' } );
				await unavailableLinkText.click();

				// Check that the Label in the inspector sidebar is Unavailable Page
				await expect( inspectorNavigationLabel ).toHaveValue(
					'Unavailable Page'
				);
			} );

			await test.step( 'Selecting a new block from a invalid synced link with a popover open should respect the new block selection', async () => {
				// Verify the popover is visible (we want the invalid link click to have opened the popover)
				await expect( linkPopover ).toBeVisible();
				await expect(
					linkPopover.getByRole( 'combobox', {
						name: 'Search or type URL',
					} )
				).toBeFocused();
				// Check that the popover has focus in the editable link state

				await catLinkText.click();

				// Verify the popover is closed
				await expect( linkPopover ).toBeHidden();
				// Check that the Label in the inspector sidebar is Cat
				await expect( inspectorNavigationLabel ).toHaveValue( 'Cat' );
			} );

			await test.step( 'Creating a new category link should respect new block selection', async () => {
				// Use the block inserter to add a new category link
				await editor.canvas
					.getByRole( 'document', { name: 'Block: Navigation' } )
					.getByRole( 'button', { name: 'Add page' } )
					.click();

				// Verify the popover is visible (we want the invalid link click to have opened the popover)
				await expect( linkPopover ).toBeVisible();
				await expect(
					linkPopover.getByRole( 'combobox', {
						name: 'Search or type URL',
					} )
				).toBeFocused();

				const addBlockPopoverButton = linkPopover.getByRole( 'button', {
					name: 'Add block',
				} );

				await addBlockPopoverButton.click();

				const addBlockDialog = page.getByRole( 'dialog', {
					name: 'Add block',
				} );

				await expect( addBlockDialog ).toBeVisible();

				const addBlockDialogBackButton = addBlockDialog.getByRole(
					'button',
					{ name: 'Back' }
				);

				await expect( addBlockDialogBackButton ).toBeFocused();

				// Step: Verify we can go back to the main Link UI and focus the add block button
				await page.keyboard.press( 'Enter' );

				// Expect focus to be on the add block button
				await expect( addBlockPopoverButton ).toBeFocused();

				await page.keyboard.press( 'Enter' );

				await expect( addBlockDialogBackButton ).toBeFocused();

				await addBlockDialog
					.getByRole( 'option', { name: 'Custom Link' } )
					.click();

				await navigation.useLinkControlSearch( 'Uncategorized' );

				// expect the sidebar to show 'Uncategorized' as the label
				await expect( inspectorNavigationLabel ).toHaveValue(
					'Uncategorized'
				);

				await expect(
					navigation.getLinkControlLink( 'Uncategorized' )
				).toBeVisible();

				await expect(
					navigation.getLinkControlLink( 'Uncategorized' )
				).toBeFocused();

				await catLinkText.click();

				// Verify the popover is closed
				await expect( linkPopover ).toBeHidden();
				// Check that the Label in the inspector sidebar is Cat
				await expect( inspectorNavigationLabel ).toHaveValue( 'Cat' );
			} );
		} );

		test( 'Can create a new page using the navigation block appender', async ( {
			page,
			pageUtils,
			navigation,
		} ) => {
			await test.step( 'Open link control', async () => {
				await pageUtils.pressKeys( 'ArrowDown' );
				await navigation.useBlockInserter();
				const linkControlSearch = navigation.getLinkControlSearch();
				await expect( linkControlSearch ).toBeFocused();
				await page.keyboard.type( 'New Page Title' );
			} );

			await test.step( 'Should not show validation error on blur when input is empty', async () => {
				// Press tab twice to reach the "Create page" button
				await pageUtils.pressKeys( 'Tab', { times: 2 } );

				await expect(
					page.getByText( 'Please fill out this field' )
				).toBeHidden();
			} );

			await test.step( 'Click Create Page button', async () => {
				// Find and click the "Create page" button
				const createPageButton = page.getByRole( 'button', {
					name: 'Create page',
				} );
				await expect( createPageButton ).toBeVisible();

				// expect the "Create page" button to be focused
				await expect( createPageButton ).toBeFocused();
				await page.keyboard.press( 'Enter' );
			} );

			const titleField = page.getByRole( 'textbox', { name: 'Title' } );

			await test.step( 'Verify page title is pre-populated', async () => {
				await expect( titleField ).toHaveValue( 'New Page Title' );
			} );

			await test.step( 'Verify Back button returns focus to Create page button', async () => {
				const backButton = page.getByRole( 'button', { name: 'Back' } );
				await expect( backButton ).toBeVisible();
				await expect( backButton ).toBeFocused();

				// Click Back button
				await backButton.click();

				// Verify focus returns to the "Create page" button
				const createPageButton = page.getByRole( 'button', {
					name: 'Create page',
				} );
				await expect( createPageButton ).toBeVisible();
				await expect( createPageButton ).toBeFocused();
			} );

			await test.step( 'Verify link control search still has the New Page Title', async () => {
				const linkControlSearch = navigation.getLinkControlSearch();
				await expect( linkControlSearch ).toHaveValue(
					'New Page Title'
				);
			} );

			await test.step( 'Go to page creation step', async () => {
				// Re-open the Create page dialog
				const createPageButton = page.getByRole( 'button', {
					name: 'Create page',
				} );
				await createPageButton.click();
				const backButton = page.getByRole( 'button', { name: 'Back' } );
				await expect( backButton ).toBeVisible();
				await expect( backButton ).toBeFocused();
			} );

			await test.step( 'Create the page', async () => {
				// Tab to the title field
				await page.keyboard.press( 'Tab' );

				await expect( titleField ).toBeFocused();
				await expect( titleField ).toHaveValue( 'New Page Title' );
				const createPageButton = page.getByRole( 'button', {
					name: 'Create page',
				} );
				// Verify the Publish checkbox (on by default)
				await page.keyboard.press( 'Tab' );
				const publishCheckbox = page.getByRole( 'checkbox', {
					name: 'Publish',
				} );
				// expect to be on the checkbox
				await expect( publishCheckbox ).toBeFocused();
				// expect the checkbox to be checked (publish is the default)
				await expect( publishCheckbox ).toBeChecked();
				// Tab to the Create page button
				await pageUtils.pressKeys( 'Tab', { times: 2 } );
				await expect( createPageButton ).toBeFocused();
				await page.keyboard.press( 'Enter' );
			} );

			await test.step( 'Verify focus is placed in the link preview', async () => {
				// After page creation, the link control should show the preview
				// and focus should be on the link
				const linkPopover = navigation.getLinkPopover();
				await expect( linkPopover ).toBeVisible();

				// The link preview should show the newly created page
				const previewLink =
					navigation.getLinkControlLink( 'New Page Title' );
				await expect( previewLink ).toBeVisible();

				// Focus should be on the link preview
				await expect( previewLink ).toBeFocused();

				await page.keyboard.press( 'Escape' );
				await expect( linkPopover ).toBeHidden();
				await expect( navigation.getNavBlockInserter() ).toBeVisible();
				await expect( navigation.getNavBlockInserter() ).toBeFocused();
			} );
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

		await navBlock.getByRole( 'button', { name: 'Add page' } ).click();

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
				await pageUtils.pressKeys( 'ArrowLeft', { times: 2 } );
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
				// - enabled (button is clickable)
				// - has the correct URL matching the page URL
				// - has the correct help text (description)
				await editor.openDocumentSettingsSidebar();
				const settingsControls = page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'tabpanel', { name: 'Content' } );

				await expect( settingsControls ).toBeVisible();

				const linkButton = settingsControls.getByRole( 'button', {
					name: /Link to:/,
				} );

				await expect( linkButton ).toBeEnabled();
				const url = new URL( testPage1.link );
				await expect( linkButton ).toContainText(
					url.pathname.replace( /\/$/, '' )
				);
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

				// Check that the link button now shows the updated URL
				await editor.openDocumentSettingsSidebar();
				const contentControls = page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'tabpanel', { name: 'Content' } );

				const updatedLinkButton = contentControls.getByRole( 'button', {
					name: /Link to:/,
				} );

				const updatedUrl = new URL( updatedPage.link );
				await expect( updatedLinkButton ).toContainText(
					updatedUrl.pathname.replace( /\/$/, '' )
				);
			} );

			const linkPopover = navigation.getLinkPopover();

			await test.step( 'Verify Link UI popover also reflects updated page URL', async () => {
				// Open Link UI via keyboard shortcut
				await pageUtils.pressKeys( 'primary+k' );

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

			const linkInput = linkPopover.getByRole( 'combobox', {
				name: 'Link',
			} );

			await test.step( 'Verify unsync button works in Link UI popover', async () => {
				// Open Link UI via keyboard shortcut
				await pageUtils.pressKeys( 'primary+k' );

				await expect( linkPopover ).toBeVisible();

				// Click Edit button
				await linkPopover
					.getByRole( 'button', { name: 'Edit' } )
					.click();

				// Find and click unsync button
				const unsyncButton = linkPopover.getByRole( 'button', {
					name: 'Unsync and edit',
				} );
				await unsyncButton.click();

				// Verify Link field becomes enabled
				await expect( linkInput ).toBeEnabled();
				await expect( linkInput ).toBeFocused();
				await expect( linkInput ).toHaveValue( '' );
			} );

			// Cancel to preserve bound state for sidebar tests
			await linkPopover.getByRole( 'button', { name: 'Cancel' } ).click();

			// Pressing Escape closes the popover
			await page.keyboard.press( 'Escape' );
			await expect( linkPopover ).toBeHidden();
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
			// to verify the Link field is clickable (not locked in entity mode)
			await editor.openDocumentSettingsSidebar();
			const contentControls = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'tabpanel', { name: 'Content' } );

			await expect( contentControls ).toBeVisible();

			// With LinkControlInspector, there's now a button instead of a textbox
			const linkButton = contentControls.getByRole( 'button', {
				name: /test-page-1/i,
			} );

			// For existing links with id but no binding, the button should be enabled and show the URL
			await expect( linkButton ).toBeEnabled();
			await expect( linkButton ).toContainText( '/test-page-1' );
		} );

		test( 'Page List converts to Navigation Links with entity bindings', async ( {
			editor,
			page,
			admin,
			requestUtils,
		} ) => {
			// Step 1: Create menu with Page List block
			const menu = await requestUtils.createNavigationMenu( {
				title: 'Test Menu with Page List',
				content: '<!-- wp:page-list /-->',
			} );

			// Step 2: Insert Navigation block
			await admin.createNewPost();

			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: {
					ref: menu.id,
				},
			} );

			// Step 3: Verify Page List is present
			const pageListBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Page List',
			} );
			await expect( pageListBlock ).toBeVisible();

			// Verify pages are shown in the list
			const pageItems = pageListBlock.locator( 'li' );

			// Wait for Page List to load pages
			await pageItems.first().waitFor( { state: 'visible' } );
			const itemCount = await pageItems.count();
			expect( itemCount ).toBeGreaterThan( 0 );

			// Step 4: Convert Page List using Edit button
			// Select the Page List block
			await editor.selectBlocks( pageListBlock );

			// Try using the toolbar Edit button instead
			const editButton = page
				.getByRole( 'button', { name: 'Edit' } )
				.first();
			await expect( editButton ).toBeVisible();

			await editButton.click();

			// Wait for modal and approve conversion
			await expect(
				page.getByRole( 'dialog', { name: 'Edit Page List' } )
			).toBeVisible();

			await page.getByRole( 'button', { name: 'Edit' } ).last().click();

			// Wait for conversion - check that Page List is gone
			await expect( pageListBlock ).toBeHidden();

			// Step 5: Verify conversion to entity links

			// Get Navigation block
			const navBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Navigation',
			} );

			// Should have Navigation Link blocks
			const navLinkBlocks = navBlock.getByRole( 'document', {
				name: 'Block: Page Link',
			} );

			const linkCount = await navLinkBlocks.count();
			expect( linkCount ).toBeGreaterThan( 0 );

			// Select first link and verify binding
			const navLinkBlock = navLinkBlocks.first();
			await editor.selectBlocks( navLinkBlock );

			// Open sidebar to check Link field
			await editor.openDocumentSettingsSidebar();
			const contentControls = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'tabpanel', { name: 'Content' } );

			await expect( contentControls ).toBeVisible();

			// With LinkControlInspector, synced links show a button with the URL
			const linkButton = contentControls.getByRole( 'button', {
				name: /Link to:/,
			} );

			// Button is enabled (clickable) even for synced links - clicking opens the search
			await expect( linkButton ).toBeEnabled();
			// Button displays the page title and status - verify it's not empty/showing error
			await expect( linkButton ).toContainText( 'test-page-1' );
			await expect( linkButton ).toContainText( 'Published' );
		} );

		test( 'handles unavailable entity binding', async ( {
			editor,
			page,
			admin,
			navigation,
			requestUtils,
		} ) => {
			await test.step( 'Setup - Create menu with binding to non-existent entity', async () => {
				await admin.createNewPost();

				// Use a non-existent page ID to simulate a deleted/unavailable entity
				// This is simpler than creating and deleting a page, and tests the same behavior
				const nonExistentPageId = 99999;

				// Create a menu with a navigation-link that has a binding to the non-existent page
				const menu = await requestUtils.createNavigationMenu( {
					title: 'Test Menu with Unavailable Entity',
					content: `<!-- wp:navigation-link {"label":"Unavailable Page","type":"page","id":${ nonExistentPageId },"kind":"post-type","metadata":{"bindings":{"url":{"source":"core/post-data","args":{"field":"link"}}}}} /-->`,
				} );

				await editor.insertBlock( {
					name: 'core/navigation',
					attributes: {
						ref: menu.id,
					},
				} );
			} );

			await test.step( 'Verify Nav Link shows "Invalid" suffix', async () => {
				// Select the Navigation Link block
				const navBlock = navigation.getNavBlock();
				await editor.selectBlocks( navBlock );

				const navLinkBlock = navBlock
					.getByRole( 'document', {
						name: 'Block: Page Link',
					} )
					.first();

				await editor.selectBlocks( navLinkBlock );

				// Check that the link displays with "(Invalid)" placeholder text
				// When invalid, it shows a div with placeholder-text class, not a textbox
				const placeholderText = navLinkBlock.locator(
					'.wp-block-navigation-link__placeholder-text'
				);
				await expect( placeholderText ).toBeVisible();
				await expect( placeholderText ).toContainText( '(Invalid)' );
			} );

			await test.step( 'Verify clicking link auto-opens Link UI', async () => {
				// Click on the navigation link in canvas
				const navLinkBlock = navigation
					.getNavBlock()
					.getByRole( 'document', {
						name: 'Block: Page Link',
					} )
					.first();

				await navLinkBlock.click();

				// Verify Link UI popover opens automatically
				const linkPopover = navigation.getLinkPopover();
				await expect( linkPopover ).toBeVisible();

				// Verify search field is empty and ready for input
				const searchInput = linkPopover.getByRole( 'combobox', {
					name: 'Search or type URL',
				} );
				await expect( searchInput ).toBeVisible();
				await expect( searchInput ).toBeEnabled();
				await expect( searchInput ).toHaveValue( '' );

				// Verify "Unsync and edit" button is NOT shown in Link UI popover
				const unsyncButton = linkPopover.getByRole( 'button', {
					name: 'Unsync and edit',
				} );
				await expect( unsyncButton ).toBeHidden();

				// Close the popover
				await page.keyboard.press( 'Escape' );
				await expect( linkPopover ).toBeHidden();
			} );

			await test.step( 'Verify link block is not auto-removed after closing Link UI', async () => {
				// Verify the link block is NOT auto-removed after closing
				// This ensures the user can see they have a broken link to fix
				const navLinkBlockAfterClose = navigation
					.getNavBlock()
					.getByRole( 'document', {
						name: 'Block: Page Link',
					} )
					.first();
				await expect( navLinkBlockAfterClose ).toBeVisible();
			} );

			await test.step( 'Verify sidebar shows error state help text', async () => {
				// Select the Navigation Link block
				const navBlock = navigation.getNavBlock();
				await editor.selectBlocks( navBlock );

				const navLinkBlock = navBlock
					.getByRole( 'document', {
						name: 'Block: Page Link',
					} )
					.first();

				await editor.selectBlocks( navLinkBlock );

				// Open document settings sidebar
				await editor.openDocumentSettingsSidebar();
				const contentControls = page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'tabpanel', { name: 'Content' } );

				await expect( contentControls ).toBeVisible();

				// With LinkControlInspector, unavailable entities show a button with error badge
				const linkButton = contentControls.getByRole( 'button', {
					name: /Missing page/i,
				} );

				// Button is enabled (can click to fix the link)
				await expect( linkButton ).toBeEnabled();

				// Button should show "Missing page" for unavailable entity
				await expect( linkButton ).toContainText( 'Missing page' );
			} );

			await test.step( 'Verify clicking button with error opens link control for fixing', async () => {
				const contentControls = page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'tabpanel', { name: 'Content' } );

				const linkButton = contentControls.getByRole( 'button', {
					name: /Missing page/i,
				} );

				// Click the button to open the link control and fix the link
				await linkButton.click();

				// Verify link control popover opens
				const linkPopover = navigation.getLinkPopover();
				await expect( linkPopover ).toBeVisible();

				// Verify search input is focused and ready for input
				const searchInput = linkPopover.getByRole( 'combobox', {
					name: 'Search or type URL',
				} );
				await expect( searchInput ).toBeFocused();

				// Enter a valid URL
				await page.keyboard.type( 'https://example.com', {
					delay: 50,
				} );
				await page.keyboard.press( 'Enter' );

				// Wait for link control to close
				await expect( linkPopover ).toBeHidden();

				// Verify button now shows the new URL
				const updatedLinkButton = contentControls.getByRole( 'button', {
					name: /Link to:/,
				} );
				await expect( updatedLinkButton ).toContainText(
					'example.com'
				);
			} );
		} );
	} );

	test.describe( 'URL Validation', () => {
		let testPage1;

		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			// Create test pages
			testPage1 = await requestUtils.createPage( {
				title: 'Test Page 1',
				status: 'publish',
			} );

			// Create post and navigation block with pre-populated links
			await admin.createNewPost();

			const menu = await requestUtils.createNavigationMenu( {
				title: 'Test Menu',
				content:
					`<!-- wp:navigation-link {"label":"Test Page 1","type":"page","id":${ testPage1.id },"url":"${ testPage1.link }","kind":"post-type"} /-->` +
					'<!-- wp:navigation-link {"label":"wordpress.org","type":"custom","url":"https://wordpress.org","kind":"custom"} /-->' +
					'<!-- wp:navigation-link {"label":"Empty Link"} /-->',
			} );

			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: {
					ref: menu.id,
				},
			} );
		} );

		test.afterEach( async ( { requestUtils } ) => {
			await requestUtils.deleteAllPages();
		} );

		test( 'link field validates on submit in Link UI popover', async ( {
			editor,
			page,
			admin,
			navigation,
			requestUtils,
			pageUtils,
		} ) => {
			await test.step( 'Setup - Create menu and navigation block', async () => {
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
			} );

			const linkPopover = navigation.getLinkPopover();
			const linkInput = linkPopover.getByRole( 'combobox', {
				name: 'Search or type URL',
			} );

			await test.step( 'Open Link inspector', async () => {
				await expect( navigation.getNavBlockInserter() ).toBeVisible();
				await pageUtils.pressKeys( 'ArrowDown' );
				await navigation.useBlockInserter();

				await expect( linkPopover ).toBeVisible();
				await expect( linkInput ).toBeFocused();
				await expect( linkInput ).toHaveValue( '' );
			} );

			await test.step( 'Verify link field validates on submit in Link UI popover', async () => {
				await page.keyboard.type( 'invalid url string' );

				await page.keyboard.press( 'Tab' );

				// Verify validation error is not shown on blur
				await expect(
					page.getByText( 'Please fill out this field' )
				).toBeHidden();

				// Go back to the link input and press enter to submit
				await pageUtils.pressKeys( 'Shift+Tab' );
				await expect( linkInput ).toBeFocused();
				await page.keyboard.press( 'Enter' );

				// Verify validation error is shown
				await expect(
					page.getByText( 'Please enter a valid URL.' )
				).toBeVisible();
			} );

			await test.step( 'Verify focus remains on link input after validation error', async () => {
				// Verify the input is focused and has the correct value
				await expect( linkInput ).toBeFocused();
				await expect( linkInput ).toHaveValue( 'invalid url string' );
			} );

			// If we type in the link input after a validation error, the validation error should be removed and the input should remain focused
			// This checks to make sure the input switching from a base input to validated input does not cause focus loss
			await test.step( 'Verify typing in link input after validation error works', async () => {
				await page.keyboard.press( 'ArrowRight' );
				await page.keyboard.type( ' after validation error' );

				// Verify the input is still focused
				await expect( linkInput ).toBeFocused();

				// Verify validation error is gone now
				await expect(
					page.getByText( 'Please enter a valid URL.' )
				).toBeHidden();

				await expect( linkInput ).toHaveValue(
					'invalid url string after validation error'
				);
				await expect( linkInput ).toBeFocused();
			} );
		} );
	} );

	test.describe( 'Navigation Link Inspector Link Editing', () => {
		let testPage1;

		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			// Create test pages
			testPage1 = await requestUtils.createPage( {
				title: 'Test Page 1',
				status: 'publish',
			} );

			await requestUtils.createPage( {
				title: 'Test Page 2',
				status: 'publish',
			} );

			// Create post and navigation block with pre-populated links
			await admin.createNewPost();

			const menu = await requestUtils.createNavigationMenu( {
				title: 'Test Menu',
				content:
					`<!-- wp:navigation-link {"label":"Test Page 1","type":"page","id":${ testPage1.id },"url":"${ testPage1.link }","kind":"post-type"} /-->` +
					'<!-- wp:navigation-link {"label":"wordpress.org","type":"custom","url":"https://wordpress.org","kind":"custom"} /-->' +
					'<!-- wp:navigation-link {"label":"Empty Link"} /-->',
			} );

			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: {
					ref: menu.id,
				},
			} );
		} );

		test.afterEach( async ( { requestUtils } ) => {
			await requestUtils.deleteAllPages();
		} );

		test( 'can update page link to a new page link', async ( {
			editor,
			page,
			navigation,
		} ) => {
			await test.step( 'Select first navigation link (Test Page 1)', async () => {
				const navLinkBlock = navigation
					.getNavBlock()
					.getByRole( 'document', {
						name: 'Block: Page Link',
					} )
					.first();

				await navLinkBlock.click();
			} );

			await test.step( 'Open inspector and verify LinkPicker shows current page', async () => {
				await editor.openDocumentSettingsSidebar();

				const settingsControls = navigation.getContentControls();
				await expect( settingsControls ).toBeVisible();

				// Verify the LinkPicker button shows the current page
				const linkButton = settingsControls.getByRole( 'button', {
					name: /Link to:/,
				} );
				await expect( linkButton ).toBeVisible();
				await expect( linkButton ).toBeEnabled();
				await expect( linkButton ).toContainText( 'localhost' );
			} );

			await test.step( 'Click LinkPicker button to open dropdown', async () => {
				const settingsControls = navigation.getContentControls();

				const linkButton = settingsControls.getByRole( 'button', {
					name: /Link to:/,
				} );

				await linkButton.click();

				const linkInput = navigation.getLinkControlSearch();
				await expect( linkInput ).toBeVisible();
				await expect( linkInput ).toBeFocused();
			} );

			await test.step( 'Select Test Page 2 from suggestions', async () => {
				// Type to search for Page 2
				await page.keyboard.type( 'Test Page 2', { delay: 50 } );

				// Wait for search results
				await expect(
					page.getByRole( 'listbox', {
						name: 'Search results',
					} )
				).toBeVisible();

				// Select Test Page 2
				await page.keyboard.press( 'ArrowDown' );
				await page.keyboard.press( 'Enter' );

				await expect( navigation.getLinkPopover() ).toBeHidden();
			} );

			await test.step( 'Verify LinkPicker now shows Test Page 2', async () => {
				const settingsControls = navigation.getContentControls();

				const linkButton = settingsControls.getByRole( 'button', {
					name: /Link to:/,
				} );
				await expect( linkButton ).toBeVisible();
				await expect( linkButton ).toBeFocused();
				await expect( linkButton ).toContainText( 'Test Page 2' );
			} );

			await test.step( 'Verify navigation link title in canvas did not get overwritten', async () => {
				const navLinkBlock = navigation
					.getNavBlock()
					.getByRole( 'document', {
						name: 'Block: Page Link',
					} )
					.first();

				await expect( navLinkBlock ).toContainText( 'Test Page 1' );
			} );
		} );

		test( 'can update page link to a custom URL', async ( {
			editor,
			page,
			navigation,
		} ) => {
			await test.step( 'Select first navigation link (Test Page 1)', async () => {
				const navLinkBlock = navigation
					.getNavBlock()
					.getByRole( 'document', {
						name: 'Block: Page Link',
					} )
					.first();

				await navLinkBlock.click();
			} );

			await test.step( 'Open inspector LinkPicker and change to custom URL', async () => {
				await editor.openDocumentSettingsSidebar();
				const settingsControls = navigation.getContentControls();

				const linkButton = settingsControls.getByRole( 'button', {
					name: /Link to:/,
				} );
				await linkButton.click();

				// Type custom URL
				const searchInput = navigation.getLinkControlSearch();
				await expect( searchInput ).toBeFocused();
				await page.keyboard.type( 'https://example.com', {
					delay: 50,
				} );
				await page.keyboard.press( 'Enter' );

				// Verify dropdown closes
				await expect( searchInput ).toBeHidden();
			} );

			await test.step( 'Verify LinkPicker shows custom URL', async () => {
				const settingsControls = navigation.getContentControls();

				const linkButton = settingsControls.getByRole( 'button', {
					name: /Link to:/,
				} );
				await expect( linkButton ).toBeVisible();
			} );

			await test.step( 'Verify navigation link in canvas updated to custom URL', async () => {
				const navLinkBlock = navigation
					.getNavBlock()
					.getByRole( 'document', {
						name: 'Block: Custom Link',
					} )
					.first();

				await expect( navLinkBlock ).toContainText( 'Test Page 1' );
			} );
		} );

		test( 'can update custom URL link to a new custom URL link', async ( {
			editor,
			page,
			navigation,
			pageUtils,
		} ) => {
			await test.step( 'Select second navigation link (wordpress.org)', async () => {
				const navLinkBlock = navigation
					.getNavBlock()
					.getByRole( 'document', {
						name: 'Block: Custom Link',
					} )
					.first();

				await navLinkBlock.click();
			} );

			await test.step( 'Open inspector LinkPicker and change to new custom URL', async () => {
				await editor.openDocumentSettingsSidebar();
				const settingsControls = navigation.getContentControls();

				const linkButton = settingsControls.getByRole( 'button', {
					name: /Link to:/,
				} );
				await linkButton.click();

				// Clear and type new custom URL
				const searchInput = navigation.getLinkControlSearch();
				await expect( searchInput ).toBeFocused();
				await pageUtils.pressKeys( 'primary+a' );
				await page.keyboard.type( 'https://example.com', {
					delay: 50,
				} );
				await page.keyboard.press( 'Enter' );

				// Verify dropdown closes
				await expect( searchInput ).toBeHidden();
			} );

			await test.step( 'Verify LinkPicker shows new custom URL', async () => {
				const settingsControls = navigation.getContentControls();

				const linkButton = settingsControls.getByRole( 'button', {
					name: /Link to:/,
				} );
				await expect( linkButton ).toBeVisible();
				await expect( linkButton ).toBeFocused();
				await expect( linkButton ).toContainText( 'example.com' );
			} );
		} );

		test( 'can add a page link to an empty link field', async ( {
			editor,
			page,
			navigation,
			pageUtils,
		} ) => {
			await test.step( 'Select third navigation link (Empty Link)', async () => {
				// Select the navigation
				await editor.selectBlocks( navigation.getNavBlock() );

				// select the block via the inspector list view instead of the canvas, as that will
				// open the link control in the canvas
				await page.getByRole( 'link', { name: 'Empty Link' } ).click();
			} );

			await test.step( 'Open inspector and verify LinkPicker shows "Add link" button', async () => {
				await editor.openDocumentSettingsSidebar();

				const settingsControls = navigation.getContentControls();
				await expect( settingsControls ).toBeVisible();

				// Verify button shows "Add link" text
				const linkButton = settingsControls.getByRole( 'button', {
					name: /Link to:/,
				} );
				await expect( linkButton ).toBeVisible();
				await expect( linkButton ).toBeEnabled();
			} );

			await test.step( 'Click LinkPicker button to open dropdown and add page link', async () => {
				const settingsControls = navigation.getContentControls();

				const linkButton = settingsControls.getByRole( 'button', {
					name: /Link to:/,
				} );
				await linkButton.click();

				// Verify LinkControl opens
				const searchInput = navigation.getLinkControlSearch();
				await expect( searchInput ).toBeVisible();
				await expect( searchInput ).toBeFocused();

				// Search and select Test Page 1
				await page.keyboard.type( 'Test Page 1', { delay: 50 } );
				await expect(
					page.getByRole( 'listbox', {
						name: 'Search results',
					} )
				).toBeVisible();
				await pageUtils.pressKeys( 'ArrowDown' );
				await page.keyboard.press( 'Enter' );

				// Verify dropdown closes
				await expect( searchInput ).toBeHidden();
			} );

			await test.step( 'Verify LinkPicker now shows the selected page', async () => {
				const settingsControls = navigation.getContentControls();

				const linkButton = settingsControls.getByRole( 'button', {
					name: /Link to:/,
				} );
				await expect( linkButton ).toBeVisible();
			} );

			await test.step( 'Verify navigation link in canvas updated with existing title', async () => {
				const navLinkBlock = navigation
					.getNavBlock()
					.getByText( 'Empty Link' );

				await expect( navLinkBlock ).toBeVisible();
			} );
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
		return this.getNavBlock().getByLabel( 'Add page' ).first();
	}

	getSubmenuBlockInserter() {
		return this.editor.canvas
			.getByRole( 'document', { name: 'Block: Submenu' } )
			.getByLabel( 'Add page' );
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

	getContentControls() {
		return this.page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'tabpanel', { name: 'Content' } );
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
	 * @param {string}  label   Text of page you want added. Must be a part of the pages added in the beforeAll in this test suite.
	 * @param {boolean} submenu Whether the page is being added to a submenu.
	 */
	async addPage( label, submenu = false ) {
		await this.useLinkControlSearch( label );

		const linkControlLink = await this.getLinkControlLink( label );

		await expect( linkControlLink ).toBeVisible();
		await expect( linkControlLink ).toBeFocused();

		await this.page.keyboard.press( 'Escape' );
		await expect( this.getLinkControlSearch() ).toBeHidden();

		// Check appender has focus
		if ( submenu ) {
			// chec for the submenu appender
			await expect( this.getSubmenuBlockInserter() ).toBeFocused();
		} else {
			await expect( this.getNavBlockInserter() ).toBeFocused();
		}
	}

	async addSubmenuPage( label ) {
		await this.addPage( label, true );
	}

	async useLinkControlSearch( label ) {
		const linkControlSearch = this.getLinkControlSearch();

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
