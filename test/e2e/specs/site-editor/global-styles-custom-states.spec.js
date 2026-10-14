const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

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

test.describe( 'Global Styles - Block custom states', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin, requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
			resetGlobalStyles( requestUtils ),
		] );
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
			resetGlobalStyles( requestUtils ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'As a user I can style the Current state of Navigation Link in Global Styles and see it on the current menu item on the frontend', async ( {
		page,
		requestUtils,
	} ) => {
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();

		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Blocks' } )
			.click();

		await page
			.getByRole( 'button', { name: 'Navigation Link', exact: true } )
			.click();

		const stateDropdown = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'States' } );

		await expect( stateDropdown ).toBeVisible();

		await stateDropdown.click();

		await expect(
			page.getByRole( 'group', { name: 'Item' } )
		).toBeVisible();

		await page
			.getByRole( 'menuitem', { name: 'Current', exact: true } )
			.click();

		await page.keyboard.press( 'Escape' );

		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'group', { name: 'Font size' } )
			.getByRole( 'radio', { name: 'Large', exact: true } )
			.click();

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save' } )
			.click();

		await page
			.getByRole( 'region', { name: 'Editor publish' } )
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();

		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toBeVisible();

		// Put a menu that links to a page in that page, so the link is the
		// current menu item when the page is visited.
		const { id: pageId, link: pageUrl } = await requestUtils.createPage( {
			title: 'Custom states test page',
			status: 'publish',
		} );

		const { id: menuId } = await requestUtils.createNavigationMenu( {
			title: 'Custom states test menu',
			content: `<!-- wp:navigation-link {"label":"Current Link","type":"page","id":${ pageId },"url":"${ pageUrl }","kind":"post-type"} /--><!-- wp:navigation-link {"label":"Other Link","url":"https://wordpress.org","kind":"custom"} /-->`,
		} );

		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/pages/${ pageId }`,
			data: {
				content: `<!-- wp:navigation {"ref":${ menuId }} /-->`,
			},
		} );

		await page.goto( pageUrl );

		const navigation = page.getByRole( 'navigation' );
		const currentItem = navigation
			.getByRole( 'listitem' )
			.filter( { hasText: 'Current Link' } );
		const otherItem = navigation
			.getByRole( 'listitem' )
			.filter( { hasText: 'Other Link' } );

		await expect( currentItem ).toHaveClass( /current-menu-item/ );
		// The default "Large" font size preset is 36px.
		await expect( currentItem ).toHaveCSS( 'font-size', '36px' );
		await expect( otherItem ).not.toHaveCSS( 'font-size', '36px' );
	} );
} );
