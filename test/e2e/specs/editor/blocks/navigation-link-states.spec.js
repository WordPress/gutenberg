const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Global Styles can style the Current state too, so start without the user's.
async function resetGlobalStyles( requestUtils ) {
	const globalStylesId =
		await requestUtils.getCurrentThemeGlobalStylesPostId();
	if ( globalStylesId ) {
		await requestUtils.rest( {
			method: 'PUT',
			path: `/wp/v2/global-styles/${ globalStylesId }`,
			data: { styles: {}, settings: {} },
		} );
	}
}

test.describe( 'Navigation Link states', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
			resetGlobalStyles( requestUtils ),
		] );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'As a user I can style the Current state of a Navigation Link and see it on the current menu item on the frontend', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		// Put a menu that links to a page in that page, so the link is the
		// current menu item when the page is visited.
		const { id: pageId, link: pageUrl } = await requestUtils.createPage( {
			title: 'Navigation Link states test page',
			status: 'publish',
		} );

		const { id: menuId } = await requestUtils.createNavigationMenu( {
			title: 'Navigation Link states test menu',
			content: `<!-- wp:navigation-link {"label":"Current Link","type":"page","id":${ pageId },"url":"${ pageUrl }","kind":"post-type"} /--><!-- wp:navigation-link {"label":"Other Link","url":"https://wordpress.org","kind":"custom"} /-->`,
		} );

		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/pages/${ pageId }`,
			data: {
				content: `<!-- wp:navigation {"ref":${ menuId }} /-->`,
			},
		} );

		// Style the link's Current state in another post that shows the menu.
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: { ref: menuId },
		} );

		await editor.selectBlocks(
			editor.canvas
				.locator( '[data-type="core/navigation-link"]' )
				.filter( { hasText: 'Current Link' } )
		);
		await editor.openDocumentSettingsSidebar();

		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		await settings
			.getByRole( 'button', { name: 'State: Default' } )
			.click();
		await page
			.getByRole( 'menuitem', { name: 'Current', exact: true } )
			.click();
		await page.keyboard.press( 'Escape' );

		await expect(
			settings.getByRole( 'button', { name: 'State: Current' } )
		).toBeVisible();

		await settings
			.getByRole( 'group', { name: 'Font size' } )
			.getByRole( 'radio', { name: 'Large', exact: true } )
			.click();

		await editor.publishPost();

		await page.goto( pageUrl );

		const navigation = page.getByRole( 'navigation' );
		const currentItem = navigation
			.getByRole( 'listitem' )
			.filter( { hasText: 'Current Link' } );
		const otherItem = navigation
			.getByRole( 'listitem' )
			.filter( { hasText: 'Other Link' } );

		await expect( currentItem ).toHaveClass( /current-menu-item/ );
		// The block's own state styles are scoped to a `wp-states-*` class.
		await expect( currentItem ).toHaveClass( /wp-states-/ );
		// The default "Large" font size preset is 36px.
		await expect( currentItem ).toHaveCSS( 'font-size', '36px' );
		await expect( otherItem ).not.toHaveCSS( 'font-size', '36px' );
	} );
} );
