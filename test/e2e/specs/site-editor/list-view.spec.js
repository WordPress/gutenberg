/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site Editor List View', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin } ) => {
		// Select a template part with a few blocks.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
			canvas: 'edit',
		} );
	} );

	test( 'should open by default when preference is enabled', async ( {
		page,
		editor,
	} ) => {
		await expect(
			page.locator( 'role=region[name="Document Overview"i]' )
		).toBeHidden();

		// Turn on block list view by default.
		await editor.setPreferences( 'core', {
			showListViewByDefault: true,
		} );

		await page.reload();

		await expect(
			page.locator( 'role=region[name="Document Overview"i]' )
		).toBeVisible();

		// The preferences cleanup.
		await editor.setPreferences( 'core', {
			showListViewByDefault: false,
		} );
	} );

	// If list view sidebar is open and focus is not inside the sidebar, move
	// focus to the sidebar when using the shortcut. If focus is inside the
	// sidebar, shortcut should close the sidebar.
	test( 'ensures List View global shortcut works properly', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Current starting focus should be at Open Navigation button.
		const openNavigationButton = page.getByRole( 'button', {
			name: 'Open Navigation',
			exact: true,
		} );
		await openNavigationButton.focus();
		await expect( openNavigationButton ).toBeFocused();

		// Open List View.
		await pageUtils.pressKeys( 'access+o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		await expect( listView ).toBeVisible();

		// The site title block should have focus.
		await expect(
			listView.getByRole( 'link', {
				name: 'Site Title',
				exact: true,
			} )
		).toBeFocused();

		// Navigate to the site tagline block.
		await page.keyboard.press( 'ArrowDown' );
		const siteTaglineItem = listView.getByRole( 'link', {
			name: 'Site Tagline',
			exact: true,
		} );
		await expect( siteTaglineItem ).toBeFocused();

		// Hit enter to focus the site tagline block in the canvas.
		await page.keyboard.press( 'Enter' );
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Site Tagline',
			} )
		).toBeFocused();

		// Since focus is now at the site tagline block in the canvas,
		// pressing the list view shortcut should bring focus back to the site tagline
		// block in the list view.
		await pageUtils.pressKeys( 'access+o' );
		await expect( siteTaglineItem ).toBeFocused();

		// Since focus is now inside the list view, the shortcut should close
		// the sidebar.
		await pageUtils.pressKeys( 'access+o' );
		await expect( listView ).toBeHidden();

		// Focus should now be on the list view toggle button.
		await expect(
			page.getByRole( 'button', { name: 'Document Overview' } )
		).toBeFocused();

		// Open List View.
		await pageUtils.pressKeys( 'access+o' );
		await expect( listView ).toBeVisible();

		// Focus the list view close button and make sure the shortcut will
		// close the list view. This is to catch a bug where elements could be
		// out of range of the sidebar region. Must shift+tab 1 time to reach
		// close button before list view area.
		await pageUtils.pressKeys( 'shift+Tab' );
		await pageUtils.pressKeys( 'shift+Tab' );
		await expect(
			page
				.getByRole( 'region', { name: 'Document Overview' } )
				.getByRole( 'button', {
					name: 'Close',
				} )
		).toBeFocused();
		await pageUtils.pressKeys( 'access+o' );
		await expect( listView ).toBeHidden();
		await expect(
			page.getByRole( 'button', { name: 'Document Overview' } )
		).toBeFocused();
	} );
} );
