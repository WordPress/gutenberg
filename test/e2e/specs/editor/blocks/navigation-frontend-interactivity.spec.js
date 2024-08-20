/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

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
		 * in the test. nce we figure out why the Tab keypresses are flakey in the test, we can
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
				attributes: { overlayMenu: 'off', openSubmenusOnClick: true },
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
			await page.click( 'body' );
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
			await page.click( 'body' );
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
			await page.click( 'body' );
			await expect( firstLevelElement ).toBeHidden();

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
			await page.click( 'body' );
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
				attributes: { overlayMenu: 'off', openSubmenusOnClick: true },
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
