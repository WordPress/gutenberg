/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Navigation block', () => {
	test( 'When a menu item is active, it should have the .current-menu-item class name', async ( {
		admin,
		editor,
		page,
	} ) => {
		const random = getRandomInt( 9999 );
		const pageTitle = `Page ${ random }`;

		await admin.createNewPost( {
			postType: 'page',
			title: pageTitle,
		} );
		await editor.publishPost();

		// Create a new menu
		await admin.visitAdminPage( 'nav-menus.php?menu=0' );
		await page.type(
			'role=textbox[name="Menu Name"i]',
			`Menu ${ random }`
		);
		await page.check( '#locations-primary' );
		await page.click( '#save_menu_footer' );
		await page.click( `[aria-label="Most Recent"] >> text=${ pageTitle }` );
		await page.click( '#submit-posttype-page' );
		// eslint-disable-next-line no-restricted-syntax
		await page.waitForTimeout( 2000 );

		await page.click( '#save_menu_footer' );

		// Go to the created page
		await admin.visitAdminPage( 'edit.php?post_type=page' );
		const link = new URL(
			await page
				.locator( `role=link[name="“Page ${ random }” \\(Edit\\)"]` )
				.getAttribute( 'href' )
		);

		const pageId = link.searchParams.get( 'post' );

		await page.goto( `${ link.origin }/?page_id=${ pageId }` );

		// Check that the menu item has the class name .current-menu-item
		await expect( page.locator( `.page-item-${ pageId }` ) ).toHaveClass(
			/current-menu-item/
		);
	} );
} );

function getRandomInt( max ) {
	return Math.floor( Math.random() * max );
}
