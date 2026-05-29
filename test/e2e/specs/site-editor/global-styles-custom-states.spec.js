/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Global Styles - Block custom states', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin, requestUtils } ) => {
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllPages();
		await requestUtils.deleteAllMenus();
		// Reset the user-saved global styles so tests are hermetic — the
		// `wp_global_styles` post persists across runs and would mask the
		// "Save enabled after change" check on re-runs.
		const globalStylesId =
			await requestUtils.getCurrentThemeGlobalStylesPostId();
		if ( globalStylesId ) {
			await requestUtils.rest( {
				method: 'PUT',
				path: `/wp/v2/global-styles/${ globalStylesId }`,
				data: { styles: {}, settings: {} },
			} );
		}
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
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'As a user I can style the @current state for Custom Link in Global Styles and see it applied on the current menu item on the frontend', async ( {
		page,
		requestUtils,
	} ) => {
		// Configure the @current style via Global Styles.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();

		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Blocks' } )
			.click();

		await page
			.getByRole( 'button', { name: 'Custom Link', exact: true } )
			.click();

		const stateDropdown = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'States' } );

		await expect( stateDropdown ).toBeVisible();

		await stateDropdown.click();

		await page
			.getByRole( 'menuitem', { name: 'Current', exact: true } )
			.click();

		await page.getByRole( 'button', { name: 'Typography' } ).click();

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

		// Create a page, point a navigation menu's Custom Link at that page,
		// then put the navigation block in the page itself. Visiting the page
		// makes its own URL the current request, so WP adds .current-menu-item
		// to the matching nav item.
		const { id: pageId, link: pageUrl } = await requestUtils.createPage( {
			title: 'Custom states test page',
			status: 'publish',
		} );

		const { id: menuId } = await requestUtils.createNavigationMenu( {
			title: 'Custom states test menu',
			content: `<!-- wp:navigation-link {"label":"Self Link","type":"page","id":${ pageId },"url":"${ pageUrl }","kind":"post-type"} /-->`,
		} );

		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/pages/${ pageId }`,
			data: {
				content: `<!-- wp:navigation {"ref":${ menuId }} /-->`,
			},
		} );

		await page.goto( pageUrl );

		const currentItem = page.locator(
			'.wp-block-navigation .current-menu-item'
		);
		await expect( currentItem ).toBeVisible();

		// The composed Global Styles rule lands on `.wp-block-navigation-link
		// .current-menu-item` (same-element class compound — talldan's preferred
		// form from #75736), so the current `<li>` should resolve to the Large
		// preset's value. WP core's default "Large" preset is 36px.
		await expect( currentItem ).toHaveCSS( 'font-size', '36px' );
	} );
} );
