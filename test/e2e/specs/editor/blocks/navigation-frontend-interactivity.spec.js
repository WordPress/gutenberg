const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Navigation block - Frontend interactivity', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.deleteAllPages();
		await requestUtils.deleteAllMenus();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.deleteAllPages();
		await requestUtils.deleteAllMenus();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.describe( 'Overlay menu', () => {
		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//header',
				postType: 'wp_template_part',
				canvas: 'edit',
			} );
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
			await editor.saveSiteEditorEntities( {
				isOnlyCurrentEntityDirty: true,
			} );
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

		/**
		 * These are already tested within the Overlay Interactions test above, but Safari is flakey on the Tab
		 * keypresses (passes 50 - 70% of the time). Tab keypresses are testing fine manually in Safari, but not
		 * in the test. Once we figure out why the Tab keypresses are flakey in the test, we can
		 * remove this test and only rely on the Overlay Interactions test above and add a (@firefox, @webkit)
		 * directive to the describe() statement. https://github.com/WordPress/gutenberg/pull/55198
		 */
		test( 'Overlay menu interactions in Safari (@webkit)', async ( {
			page,
			pageUtils,
		} ) => {
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
				canvas: 'edit',
			} );
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
				attributes: { overlayMenu: 'off', submenuVisibility: 'click' },
			} );
			await editor.saveSiteEditorEntities( {
				isOnlyCurrentEntityDirty: true,
			} );
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
			const lastFirstLevelElement = page.getByRole( 'link', {
				name: 'Complex Submenu Link 2',
			} );

			// Test: submenu opens on click
			await expect( innerElement ).toBeHidden();
			await simpleSubmenuButton.click();
			await expect( simpleSubmenuButton ).toBeFocused();
			await expect( innerElement ).toBeVisible();

			// Test: submenu closes on click outside submenu
			await page.locator( 'body' ).click();
			await expect( innerElement ).toBeHidden();

			// Test: nested submenu opens on click
			await complexSubmenuButton.click();
			await expect( complexSubmenuButton ).toBeFocused();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeHidden();

			await nestedSubmenuButton.click();
			await expect( nestedSubmenuButton ).toBeFocused();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeVisible();

			// Test: nested submenus close on click outside submenu
			await page.locator( 'body' ).click();
			await expect( firstLevelElement ).toBeHidden();
			await expect( secondLevelElement ).toBeHidden();

			// Test: submenu opens on Enter keypress
			await simpleSubmenuButton.focus();
			await pageUtils.pressKeys( 'Enter' );
			await expect( simpleSubmenuButton ).toBeFocused();
			await expect( innerElement ).toBeVisible();

			// Test: submenu closes on ESC key and focuses parent link
			await pageUtils.pressKeys( 'Escape' );
			await expect( innerElement ).toBeHidden();
			await expect( simpleSubmenuButton ).toBeFocused();

			// Test: submenu closes on tab outside submenu
			await pageUtils.pressKeys( 'Enter' );
			await expect( simpleSubmenuButton ).toBeFocused();
			await expect( innerElement ).toBeVisible();
			// Tab to first element, then tab outside the submenu.
			await pageUtils.pressKeys( 'Tab', { times: 2, delay: 50 } );
			await expect( complexSubmenuButton ).toBeFocused();
			await expect( innerElement ).toBeHidden();

			// Test: only nested submenu closes on tab outside
			await pageUtils.pressKeys( 'Enter' );
			await expect( complexSubmenuButton ).toBeFocused();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeHidden();

			await nestedSubmenuButton.click();
			await expect( nestedSubmenuButton ).toBeFocused();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeVisible();

			// Tab to nested submenu first element, then tab outside the nested
			// submenu.
			await pageUtils.pressKeys( 'Tab', { times: 2, delay: 50 } );
			await expect( lastFirstLevelElement ).toBeFocused();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeHidden();
			// Tab outside the complex submenu.
			await page.keyboard.press( 'Tab' );
			await expect( firstLevelElement ).toBeHidden();

			// Test: nested submenu closes on ESC key and focuses parent menu item:
			// See: https://github.com/WordPress/gutenberg/issues/69834
			await complexSubmenuButton.click();
			await nestedSubmenuButton.click();
			await expect( secondLevelElement ).toBeVisible();
			await pageUtils.pressKeys( 'Escape' );
			await expect( secondLevelElement ).toBeHidden();
			await expect( nestedSubmenuButton ).toBeFocused();
		} );

		/**
		 * These are already tested within the Submenu Interactions test above, but Safari is flakey on the
		 * Tab keypresses (passes 50 - 70% of the time). Tab keypresses are testing fine manually in Safari,
		 * but not in the test. Once we figure out why the Tab keypresses are flakey in the test, we can
		 * remove this test and only rely on the Submenu interactions test above and add a (@firefox, @webkit)
		 * directive to the describe() statement. https://github.com/WordPress/gutenberg/pull/55198
		 */
		test( 'Submenu interactions on Safari (@webkit)', async ( {
			page,
			pageUtils,
		} ) => {
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

			// Test: submenu opens on click and focuses the button
			await expect( innerElement ).toBeHidden();
			await simpleSubmenuButton.click();
			await expect( simpleSubmenuButton ).toBeFocused();
			await expect( innerElement ).toBeVisible();

			// Test: a second click closes the submenu
			await simpleSubmenuButton.click();
			await expect( simpleSubmenuButton ).toBeFocused();
			await expect( innerElement ).toBeHidden();

			// Test: submenu opens on Enter keypress
			await simpleSubmenuButton.focus();
			await pageUtils.pressKeys( 'Enter' );
			await expect( simpleSubmenuButton ).toBeFocused();
			await expect( innerElement ).toBeVisible();

			// Test: submenu closes on second Enter keypress
			await pageUtils.pressKeys( 'Enter' );
			await expect( innerElement ).toBeHidden();
			await expect( simpleSubmenuButton ).toBeFocused();

			// Test: inner submenu opens on click and focuses the button
			await complexSubmenuButton.click();
			await expect( complexSubmenuButton ).toBeFocused();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeHidden();
			// Click the inner menu button and check it opens the third level menu
			await nestedSubmenuButton.click();
			await expect( nestedSubmenuButton ).toBeFocused();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeVisible();

			// Click the inner menu button and check it closes the third level menu
			await nestedSubmenuButton.click();
			await expect( nestedSubmenuButton ).toBeFocused();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeHidden();

			// Do the same with Enter keypresses: open the third level menu
			await pageUtils.pressKeys( 'Enter' );
			await expect( nestedSubmenuButton ).toBeFocused();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeVisible();

			// Close the third level menu
			await pageUtils.pressKeys( 'Enter' );
			await expect( nestedSubmenuButton ).toBeFocused();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeHidden();

			// Close the menu via click on the body
			await page.locator( 'body' ).click();
			await expect( firstLevelElement ).toBeHidden();

			// Test: nested submenu closes on ESC key and focuses parent menu item:
			// See: https://github.com/WordPress/gutenberg/issues/69834
			await complexSubmenuButton.click();
			await nestedSubmenuButton.click();
			await expect( secondLevelElement ).toBeVisible();
			await pageUtils.pressKeys( 'Escape' );
			await expect( secondLevelElement ).toBeHidden();
			await expect( nestedSubmenuButton ).toBeFocused();

			// Tests not covered: Tabbing to close menus
		} );
	} );

	test.describe( 'Submenus (Arrow setting) (@firefox, @webkit)', () => {
		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//header',
				postType: 'wp_template_part',
				canvas: 'edit',
			} );
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
			await editor.saveSiteEditorEntities( {
				isOnlyCurrentEntityDirty: true,
			} );
		} );

		test( 'submenu click on the arrow interactions', async ( { page } ) => {
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
			// Open first submenu level
			await arrowButton.click();
			await expect( arrowButton ).toBeFocused();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeHidden();

			// Close first submenu level, check that it closes and focus is on the arrow button
			await arrowButton.click();
			await expect( arrowButton ).toBeFocused();
			// Move the mouse so the hover on the button doesn't keep the menu open
			await page.mouse.move( 400, 400 );
			await expect( firstLevelElement ).toBeHidden();
			await expect( secondLevelElement ).toBeHidden();

			// Open first submenu level one more time so we can test the nested submenu
			await arrowButton.click();
			await expect( arrowButton ).toBeFocused();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeHidden();

			// Nested submenu open
			await nestedSubmenuArrowButton.click();
			await expect( nestedSubmenuArrowButton ).toBeFocused();
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeVisible();

			// Nested submenu close
			await nestedSubmenuArrowButton.click();
			await expect( nestedSubmenuArrowButton ).toBeFocused();
			// Move the mouse so the hover on the button doesn't keep the menu open
			await page.mouse.move( 400, 400 );
			await expect( firstLevelElement ).toBeVisible();
			await expect( secondLevelElement ).toBeHidden();

			// Close menu via click on the body
			await page.locator( 'body' ).click();
			await expect( firstLevelElement ).toBeHidden();
			await expect( secondLevelElement ).toBeHidden();
		} );
	} );

	test.describe( 'Page list block (@firefox, @webkit)', () => {
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
				canvas: 'edit',
			} );
			await requestUtils.createNavigationMenu( {
				title: 'Page list menu',
				content: `
					<!-- wp:page-list /-->
					<!-- wp:navigation-link {"label":"Link","type":"custom","url":"http://www.wordpress.org/"} /-->
					`,
			} );
			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: { overlayMenu: 'off', submenuVisibility: 'click' },
			} );
			await editor.saveSiteEditorEntities( {
				isOnlyCurrentEntityDirty: true,
			} );
		} );

		test( 'page-list submenu user interactions', async ( {
			page,
			pageUtils,
		} ) => {
			await page.goto( '/' );
			const submenuButton = page.getByRole( 'button', {
				name: 'Parent',
			} );
			const innerElement = page.getByRole( 'link', {
				name: 'Subpage',
			} );
			await expect( innerElement ).toBeHidden();

			// page-list submenu opens on click
			await submenuButton.click();
			await expect( innerElement ).toBeVisible();

			// page-list submenu closes on click outside
			await page.locator( 'body' ).click();
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

	test.describe( 'Legacy openSubmenusOnClick backward compatibility', () => {
		test( 'Should render and migrate legacy openSubmenusOnClick blocks', async ( {
			page,
			admin,
			editor,
			requestUtils,
		} ) => {
			let postId;

			await test.step( 'Insert post directly to database with legacy markup', async () => {
				// Insert directly to database to avoid editor migration
				const response = await requestUtils.rest( {
					method: 'POST',
					path: '/wp/v2/posts',
					data: {
						title: 'Legacy Navigation Test',
						content: `<!-- wp:navigation {"openSubmenusOnClick":true,"overlayMenu":"never"} -->
<!-- wp:navigation-submenu {"label":"Products"} -->
<!-- wp:navigation-link {"label":"Product 1","url":"#"} /-->
<!-- wp:navigation-link {"label":"Product 2","url":"#"} /-->
<!-- /wp:navigation-submenu -->
<!-- wp:navigation-link {"label":"About","url":"#"} /-->
<!-- /wp:navigation -->`,
						status: 'publish',
					},
				} );

				postId = response.id;
			} );

			await test.step( 'Verify frontend renders correctly before editor load', async () => {
				await page.goto( `/?p=${ postId }` );

				// Find the submenu list item
				const submenuItem = page
					.locator( 'li.wp-block-navigation-item' )
					.filter( { has: page.locator( 'text="Products"' ) } )
					.first();

				// Should have open-on-click class for backward compatibility
				await expect( submenuItem ).toHaveClass( /open-on-click/ );
			} );

			await test.step( 'Load in editor - migration runs in memory only', async () => {
				await admin.editPost( postId );

				// Wait for blocks to load
				const navigationBlock = editor.canvas.locator(
					'[data-type="core/navigation"]'
				);
				await expect( navigationBlock ).toBeVisible();

				// The deprecation runs in the editor in memory, transforming the block
				// But the database is NOT updated automatically - requires an edit + save
				const contentInEditor = await editor.getEditedPostContent();
				// Raw content still shows legacy attribute since no save happened yet
				expect( contentInEditor ).toContain( 'openSubmenusOnClick' );

				// Make an edit to trigger save capability
				// This causes the migrated block attributes to be persisted on save
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: { content: 'Test paragraph' },
				} );
			} );

			await test.step( 'Save post and verify migration was written to database', async () => {
				// For published posts, we need to use the save button (Update)
				const saveButton = page
					.getByRole( 'region', {
						name: 'Editor top bar',
					} )
					.getByRole( 'button', { name: 'Save', exact: true } );

				await saveButton.click();
				await page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'updated' } )
					.waitFor();

				// Fetch the post from the database to see what was actually saved
				const savedPost = await requestUtils.rest( {
					path: `/wp/v2/posts/${ postId }`,
					params: {
						context: 'edit',
					},
				} );

				// After saving, the migration should have been applied
				// The content should now have submenuVisibility instead of openSubmenusOnClick
				const content = savedPost.content.raw;

				expect( content ).toContain( '"submenuVisibility":"click"' );
				expect( content ).not.toContain( 'openSubmenusOnClick' );
			} );

			await test.step( 'Verify frontend still works after migration', async () => {
				// Navigate to frontend
				await page.goto( `/?p=${ postId }` );

				const submenuItem = page
					.locator( 'li.wp-block-navigation-item' )
					.filter( { has: page.locator( 'text="Products"' ) } )
					.first();

				// Should still have open-on-click class after migration
				await expect( submenuItem ).toHaveClass( /open-on-click/ );
			} );
		} );

		test.describe( 'Submenu touch device interactions', () => {
			test.beforeEach( async ( { admin, editor, requestUtils } ) => {
				await admin.visitSiteEditor( {
					postId: 'emptytheme//header',
					postType: 'wp_template_part',
					canvas: 'edit',
				} );
				await requestUtils.createNavigationMenu( {
					title: 'Touch test menu',
					content: `
					<!-- wp:navigation-submenu {"label":"Submenu","type":"internal","url":"#heading","kind":"custom"} -->
						<!-- wp:navigation-link {"label":"Submenu Link","type":"custom","url":"http://www.wordpress.org/"} /-->
					<!-- /wp:navigation-submenu -->
					`,
				} );
				await editor.insertBlock( {
					name: 'core/navigation',
					attributes: { overlayMenu: 'off' },
				} );
				await editor.saveSiteEditorEntities( {
					isOnlyCurrentEntityDirty: true,
				} );
			} );

			test( 'submenu does not open via hover on touch devices', async ( {
				page,
				browser,
			} ) => {
				// Create a touch device context where (hover: none) matches.
				const touchContext = await browser.newContext( {
					hasTouch: true,
				} );
				const touchPage = await touchContext.newPage();

				// Copy auth cookies from the original context.
				const cookies = await page.context().cookies();
				await touchContext.addCookies( cookies );

				await touchPage.goto( new URL( '/', page.url() ).href );

				const innerElement = touchPage.getByRole( 'link', {
					name: 'Submenu Link',
				} );

				// Submenu should be hidden initially.
				await expect( innerElement ).toBeHidden();

				// Simulate a touch pointerenter event. On real touch devices,
				// tapping an element fires pointerenter with pointerType "touch"
				// before the click event, which would previously set hover=true
				// and leave the submenu stuck open. Our guard should return early
				// and leave the submenu hidden.
				const submenuLi = touchPage.locator( 'li.has-child' ).first();
				await submenuLi.dispatchEvent( 'pointerenter', {
					pointerType: 'touch',
				} );
				await expect( innerElement ).toBeHidden();

				await touchContext.close();
			} );

			test( 'chevron opens and closes submenu on touch devices', async ( {
				page,
				browser,
			} ) => {
				// Create a touch device context where (hover: none) matches.
				const touchContext = await browser.newContext( {
					hasTouch: true,
				} );
				const touchPage = await touchContext.newPage();

				// Copy auth cookies from the original context.
				const cookies = await page.context().cookies();
				await touchContext.addCookies( cookies );

				await touchPage.goto( new URL( '/', page.url() ).href );

				const arrowButton = touchPage.getByRole( 'button', {
					name: 'Submenu submenu',
				} );
				const innerElement = touchPage.getByRole( 'link', {
					name: 'Submenu Link',
				} );

				// Submenu should be hidden initially.
				await expect( innerElement ).toBeHidden();

				// Click the chevron to open the submenu.
				await arrowButton.click();
				await expect( arrowButton ).toHaveAttribute(
					'aria-expanded',
					'true'
				);
				await expect( innerElement ).toBeVisible();

				// Click the chevron again to close the submenu.
				await arrowButton.click();
				await expect( arrowButton ).toHaveAttribute(
					'aria-expanded',
					'false'
				);

				// The submenu may still be visible due to CSS :focus-within
				// while the button retains focus. Clicking elsewhere removes
				// focus and the submenu should then be hidden.
				await touchPage
					.locator( 'body' )
					.click( { position: { x: 0, y: 0 } } );
				await expect( innerElement ).toBeHidden();

				await touchContext.close();
			} );

			test( 'submenu still opens via hover on non-touch devices', async ( {
				page,
			} ) => {
				await page.goto( '/' );

				const innerElement = page.getByRole( 'link', {
					name: 'Submenu Link',
				} );

				// Submenu should be hidden initially.
				await expect( innerElement ).toBeHidden();

				// On a non-touch device (default Playwright context),
				// pointerenter with pointerType "mouse" should still open the
				// submenu via hover — verifying we haven't broken desktop hover.
				const submenuLi = page.locator( 'li.has-child' ).first();
				await submenuLi.dispatchEvent( 'pointerenter', {
					pointerType: 'mouse',
				} );
				await expect( innerElement ).toBeVisible();
			} );
		} );
	} );

	// Submenu overflow scenarios are anchored to a viewport edge rather than
	// tuned to a viewport width. A submenu is at least 200px wide, so the item
	// at the start of a menu is always narrower than its own submenu and the
	// item at the end of a right-justified menu always has its trailing edge on
	// the viewport edge. Both hold whatever width the theme's font renders the
	// labels at.
	//
	// The widths are also at or above the 782px breakpoint where nested
	// submenus fly out sideways. Below it they stack vertically, so a deep tree
	// is no wider than a single level and there is nothing to correct.
	const FLYOUT_VIEWPORT = { width: 800, height: 800 };

	/**
	 * The horizontal extent of every level of a submenu tree.
	 *
	 * @param {Object} navigationItem Locator for the item that owns the tree.
	 */
	async function submenuTreeBounds( navigationItem ) {
		const edges = await navigationItem
			.locator( '.wp-block-navigation__submenu-container' )
			.evaluateAll( ( elements ) =>
				elements.map( ( element ) => {
					const { left, right } = element.getBoundingClientRect();
					return [ left, right ];
				} )
			);
		return {
			left: Math.min( ...edges.map( ( [ left ] ) => left ) ),
			right: Math.max( ...edges.map( ( [ , right ] ) => right ) ),
		};
	}

	test.describe( 'Submenu overflow positioning (@firefox, @webkit)', () => {
		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//header',
				postType: 'wp_template_part',
				canvas: 'edit',
			} );
			await requestUtils.createNavigationMenu( {
				title: 'Start edge menu',
				content: `
					<!-- wp:navigation-submenu {"label":"Edge Submenu","type":"internal","url":"#heading","kind":"custom"} -->
						<!-- wp:navigation-link {"label":"Submenu Link 1","type":"custom","url":"http://www.wordpress.org/"} /-->
						<!-- wp:navigation-link {"label":"Submenu Link 2","type":"custom","url":"http://www.wordpress.org/"} /-->
					<!-- /wp:navigation-submenu -->
					<!-- wp:navigation-link {"label":"Item 1","type":"custom","url":"http://www.wordpress.org/"} /-->
					<!-- wp:navigation-link {"label":"Item 2","type":"custom","url":"http://www.wordpress.org/"} /-->
					`,
			} );
			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: { overlayMenu: 'off', submenuVisibility: 'click' },
			} );
			await editor.saveSiteEditorEntities( {
				isOnlyCurrentEntityDirty: true,
			} );
		} );

		test( 'submenu opens on right when it would overflow the left edge', async ( {
			page,
		} ) => {
			await page.setViewportSize( FLYOUT_VIEWPORT );
			await page.goto( '/' );

			const submenuButton = page.getByRole( 'button', {
				name: 'Edge Submenu',
			} );
			await submenuButton.click();

			const navigationItem = page.locator(
				'.wp-block-navigation-item.has-child',
				{ has: submenuButton }
			);
			await expect(
				navigationItem.locator(
					'.wp-block-navigation__submenu-container'
				)
			).toBeVisible();
			await expect( navigationItem ).toHaveClass( /open-on-right/ );

			// A pixel of slack for the submenu borders.
			const bounds = await submenuTreeBounds( navigationItem );
			expect( bounds.left ).toBeGreaterThanOrEqual( -1 );
		} );
	} );

	test.describe( 'Submenu overflow positioning with right-justified navigation (@firefox, @webkit)', () => {
		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//header',
				postType: 'wp_template_part',
				canvas: 'edit',
			} );
			await requestUtils.createNavigationMenu( {
				title: 'End edge menu',
				content: `
						<!-- wp:navigation-link {"label":"Item 1","type":"custom","url":"http://www.wordpress.org/"} /-->
						<!-- wp:navigation-link {"label":"Item 2","type":"custom","url":"http://www.wordpress.org/"} /-->
						<!-- wp:navigation-submenu {"label":"Edge Submenu","type":"internal","url":"#heading","kind":"custom"} -->
							<!-- wp:navigation-link {"label":"Submenu Link 1","type":"custom","url":"http://www.wordpress.org/"} /-->
							<!-- wp:navigation-link {"label":"Submenu Link 2","type":"custom","url":"http://www.wordpress.org/"} /-->
						<!-- /wp:navigation-submenu -->
						`,
			} );
			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: {
					overlayMenu: 'off',
					submenuVisibility: 'click',
					layout: {
						type: 'flex',
						justifyContent: 'right',
					},
				},
			} );
			await editor.saveSiteEditorEntities( {
				isOnlyCurrentEntityDirty: true,
			} );
		} );

		test( 'submenu opens on left when it would overflow the right edge', async ( {
			page,
		} ) => {
			await page.setViewportSize( FLYOUT_VIEWPORT );
			await page.goto( '/' );

			const submenuButton = page.getByRole( 'button', {
				name: 'Edge Submenu',
			} );
			await submenuButton.click();

			const navigationItem = page.locator(
				'.wp-block-navigation-item.has-child',
				{ has: submenuButton }
			);
			await expect(
				navigationItem.locator(
					'.wp-block-navigation__submenu-container'
				)
			).toBeVisible();
			await expect( navigationItem ).toHaveClass( /open-on-left/ );

			const bounds = await submenuTreeBounds( navigationItem );
			expect( bounds.right ).toBeLessThanOrEqual(
				FLYOUT_VIEWPORT.width + 1
			);
		} );
	} );

	test.describe( 'Submenu with room on both sides (@firefox, @webkit)', () => {
		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//header',
				postType: 'wp_template_part',
				canvas: 'edit',
			} );
			await requestUtils.createNavigationMenu( {
				title: 'Roomy menu',
				content: `
					<!-- wp:navigation-link {"label":"Navigation Item One","type":"custom","url":"http://www.wordpress.org/"} /-->
					<!-- wp:navigation-link {"label":"Navigation Item Two","type":"custom","url":"http://www.wordpress.org/"} /-->
					<!-- wp:navigation-link {"label":"Navigation Item Three","type":"custom","url":"http://www.wordpress.org/"} /-->
					<!-- wp:navigation-submenu {"label":"Roomy Submenu","type":"internal","url":"#heading","kind":"custom"} -->
						<!-- wp:navigation-link {"label":"Submenu Link 1","type":"custom","url":"http://www.wordpress.org/"} /-->
						<!-- wp:navigation-link {"label":"Submenu Link 2","type":"custom","url":"http://www.wordpress.org/"} /-->
					<!-- /wp:navigation-submenu -->
					`,
			} );
			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: { overlayMenu: 'off', submenuVisibility: 'click' },
			} );
			await editor.saveSiteEditorEntities( {
				isOnlyCurrentEntityDirty: true,
			} );
		} );

		test( 'submenu keeps the default positioning when it fits either way', async ( {
			page,
		} ) => {
			await page.setViewportSize( { width: 1920, height: 1080 } );
			await page.goto( '/' );

			const submenuButton = page.getByRole( 'button', {
				name: 'Roomy Submenu',
			} );
			await submenuButton.click();

			const navigationItem = page.locator(
				'.wp-block-navigation-item.has-child',
				{ has: submenuButton }
			);
			await expect(
				navigationItem.locator(
					'.wp-block-navigation__submenu-container'
				)
			).toBeVisible();
			await expect( navigationItem ).not.toHaveClass(
				/open-on-left|open-on-right/
			);
		} );
	} );

	test.describe( 'Nested submenu overflow positioning (@firefox, @webkit)', () => {
		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//header',
				postType: 'wp_template_part',
				canvas: 'edit',
			} );
			await requestUtils.createNavigationMenu( {
				title: 'Nested overflow menu',
				content: `
					<!-- wp:navigation-link {"label":"Item 1","type":"custom","url":"http://www.wordpress.org/"} /-->
					<!-- wp:navigation-link {"label":"Item 2","type":"custom","url":"http://www.wordpress.org/"} /-->
					<!-- wp:navigation-submenu {"label":"Top Submenu","type":"internal","url":"#heading","kind":"custom"} -->
						<!-- wp:navigation-link {"label":"Child Link","type":"custom","url":"http://www.wordpress.org/"} /-->
						<!-- wp:navigation-submenu {"label":"Nested Submenu","type":"internal","url":"#heading","kind":"custom"} -->
							<!-- wp:navigation-link {"label":"Deep Link","type":"custom","url":"http://www.wordpress.org/"} /-->
						<!-- /wp:navigation-submenu -->
					<!-- /wp:navigation-submenu -->
					`,
			} );
			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: { overlayMenu: 'off', submenuVisibility: 'click' },
			} );
			await editor.saveSiteEditorEntities( {
				isOnlyCurrentEntityDirty: true,
			} );
		} );

		// The direction is picked from the whole tree, so a nested submenu
		// should never spill out of the viewport - including at widths where
		// the first level on its own would have fitted. One width just above
		// the flyout breakpoint and one with room to spare.
		for ( const width of [ 800, 1200 ] ) {
			test( `nested submenu stays within a ${ width }px viewport`, async ( {
				page,
			} ) => {
				await page.setViewportSize( { width, height: 800 } );
				await page.goto( '/' );

				await page
					.getByRole( 'button', { name: 'Top Submenu' } )
					.click();
				await page
					.getByRole( 'button', { name: 'Nested Submenu' } )
					.click();

				const nestedContainer = page.locator(
					'.wp-block-navigation__submenu-container .wp-block-navigation__submenu-container'
				);
				await expect( nestedContainer ).toBeVisible();

				// A pixel of slack for the submenu borders.
				const box = await nestedContainer.boundingBox();
				expect( box.x ).toBeGreaterThanOrEqual( -1 );
				expect( box.x + box.width ).toBeLessThanOrEqual( width + 1 );
			} );
		}

		test( 'the whole submenu tree opens in a single direction', async ( {
			page,
		} ) => {
			await page.setViewportSize( FLYOUT_VIEWPORT );
			await page.goto( '/' );

			await page.getByRole( 'button', { name: 'Top Submenu' } ).click();
			await page
				.getByRole( 'button', { name: 'Nested Submenu' } )
				.click();

			// Only the outermost item carries a direction; nested items
			// inherit it rather than choosing their own.
			const nestedWithDirection = page.locator(
				'.wp-block-navigation__submenu-container .has-child.open-on-left, .wp-block-navigation__submenu-container .has-child.open-on-right'
			);
			await expect( nestedWithDirection ).toHaveCount( 0 );
		} );
	} );

	test.describe( 'Nested submenu overflow with right-justified navigation (@firefox, @webkit)', () => {
		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//header',
				postType: 'wp_template_part',
				canvas: 'edit',
			} );
			await requestUtils.createNavigationMenu( {
				title: 'Nested right-justified menu',
				content: `
						<!-- wp:navigation-submenu {"label":"Edge Submenu","type":"internal","url":"#heading","kind":"custom"} -->
							<!-- wp:navigation-link {"label":"Child Link","type":"custom","url":"http://www.wordpress.org/"} /-->
							<!-- wp:navigation-submenu {"label":"Nested Left Submenu","type":"internal","url":"#heading","kind":"custom"} -->
								<!-- wp:navigation-link {"label":"Deep Link","type":"custom","url":"http://www.wordpress.org/"} /-->
							<!-- /wp:navigation-submenu -->
						<!-- /wp:navigation-submenu -->
						<!-- wp:navigation-link {"label":"Item 1","type":"custom","url":"http://www.wordpress.org/"} /-->
						<!-- wp:navigation-link {"label":"Item 2","type":"custom","url":"http://www.wordpress.org/"} /-->
						`,
			} );
			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: {
					overlayMenu: 'off',
					submenuVisibility: 'click',
					layout: {
						type: 'flex',
						justifyContent: 'right',
					},
				},
			} );
			await editor.saveSiteEditorEntities( {
				isOnlyCurrentEntityDirty: true,
			} );
		} );

		// A right-justified submenu opens leftward by default, so a nested
		// level can run past the left edge even when the first level fits.
		test( 'nested submenu stays within the viewport', async ( {
			page,
		} ) => {
			await page.setViewportSize( FLYOUT_VIEWPORT );
			await page.goto( '/' );

			await page.getByRole( 'button', { name: 'Edge Submenu' } ).click();
			await page
				.getByRole( 'button', { name: 'Nested Left Submenu' } )
				.click();

			const nestedContainer = page.locator(
				'.wp-block-navigation__submenu-container .wp-block-navigation__submenu-container'
			);
			await expect( nestedContainer ).toBeVisible();

			// A pixel of slack for the submenu borders.
			const box = await nestedContainer.boundingBox();
			expect( box.x ).toBeGreaterThanOrEqual( -1 );
			expect( box.x + box.width ).toBeLessThanOrEqual(
				FLYOUT_VIEWPORT.width + 1
			);
		} );
	} );

	test.describe( 'Deeply nested submenu overflow (@firefox, @webkit)', () => {
		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//header',
				postType: 'wp_template_part',
				canvas: 'edit',
			} );
			await requestUtils.createNavigationMenu( {
				title: 'Deep menu',
				content: `
					<!-- wp:navigation-submenu {"label":"Level 1","type":"internal","url":"#heading","kind":"custom"} -->
						<!-- wp:navigation-submenu {"label":"Level 2","type":"internal","url":"#heading","kind":"custom"} -->
							<!-- wp:navigation-submenu {"label":"Level 3","type":"internal","url":"#heading","kind":"custom"} -->
								<!-- wp:navigation-submenu {"label":"Level 4","type":"internal","url":"#heading","kind":"custom"} -->
									<!-- wp:navigation-submenu {"label":"Level 5","type":"internal","url":"#heading","kind":"custom"} -->
										<!-- wp:navigation-link {"label":"Deep Link","type":"custom","url":"http://www.wordpress.org/"} /-->
									<!-- /wp:navigation-submenu -->
								<!-- /wp:navigation-submenu -->
							<!-- /wp:navigation-submenu -->
						<!-- /wp:navigation-submenu -->
					<!-- /wp:navigation-submenu -->
					`,
			} );
			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: { overlayMenu: 'off', submenuVisibility: 'click' },
			} );
			await editor.saveSiteEditorEntities( {
				isOnlyCurrentEntityDirty: true,
			} );
		} );

		// Five levels are at least 1000px wide, so the tree cannot fit in an
		// 800px viewport whichever way it opens. It should still commit to the
		// side that spills less - here rightward, since the item sits at the
		// start of the menu and opening leftward would spill the full width of
		// the tree - rather than giving up and leaving the default in place.
		test( 'still picks a direction when neither side fits', async ( {
			page,
		} ) => {
			await page.setViewportSize( FLYOUT_VIEWPORT );
			await page.goto( '/' );

			const submenuButton = page.getByRole( 'button', {
				name: 'Level 1',
			} );
			await submenuButton.click();

			const navigationItem = page.locator(
				'.wp-block-navigation-item.has-child',
				{ has: submenuButton }
			);
			await expect( navigationItem ).toHaveClass( /open-on-right/ );
		} );
	} );

	test.describe( 'Submenu direction overrides the justification rules (@firefox, @webkit)', () => {
		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//header',
				postType: 'wp_template_part',
				canvas: 'edit',
			} );
			await requestUtils.createNavigationMenu( {
				title: 'Space between menu',
				content: `
						<!-- wp:navigation-submenu {"label":"Only Submenu","type":"internal","url":"#heading","kind":"custom"} -->
							<!-- wp:navigation-link {"label":"Submenu Link 1","type":"custom","url":"http://www.wordpress.org/"} /-->
							<!-- wp:navigation-link {"label":"Submenu Link 2","type":"custom","url":"http://www.wordpress.org/"} /-->
						<!-- /wp:navigation-submenu -->
						`,
			} );
			// `never` keeps the container a direct child of the nav, which
			// is what the space-between justification rule selects on.
			await editor.insertBlock( {
				name: 'core/navigation',
				attributes: {
					overlayMenu: 'never',
					submenuVisibility: 'click',
					layout: {
						type: 'flex',
						justifyContent: 'space-between',
					},
				},
			} );
			await editor.saveSiteEditorEntities( {
				isOnlyCurrentEntityDirty: true,
			} );
		} );

		// The last item of a space-between menu opens leftward by default.
		// It is also the only item here, so it sits at the start of the
		// menu and opening leftward leaves the viewport: the measured
		// direction has to win over the justification rule.
		test( 'the measured direction beats the justification default', async ( {
			page,
		} ) => {
			await page.setViewportSize( FLYOUT_VIEWPORT );
			await page.goto( '/' );

			const submenuButton = page.getByRole( 'button', {
				name: 'Only Submenu',
			} );
			await submenuButton.click();

			const navigationItem = page.locator(
				'.wp-block-navigation-item.has-child',
				{ has: submenuButton }
			);
			await expect( navigationItem ).toHaveClass( /open-on-right/ );

			// A pixel of slack for the submenu borders.
			const bounds = await submenuTreeBounds( navigationItem );
			expect( bounds.left ).toBeGreaterThanOrEqual( -1 );
		} );
	} );
} );
