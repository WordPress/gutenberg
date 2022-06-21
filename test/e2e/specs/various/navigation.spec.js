/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Classic menus', () => {
	test( 'When a menu item is active, it should have the .current-menu-item class name', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const random = getRandomInt( 9999 );
		const pageTitle = `Page ${ random }`;

		const newPage = await requestUtils.createNewPage(
			pageTitle,
			'publish'
		);

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

		await expect(
			page.locator( '#menu-to-edit .menu-item-title' )
		).toContainText( `${ pageTitle }` );

		await page.click( '#save_menu_footer' );

		// Go to the created page
		await page.goto( newPage.guid.rendered );

		// Check that the menu item has the class name .current-menu-item
		await expect(
			page.locator( `.page-item-${ newPage.id }` )
		).toHaveClass( /current-menu-item/ );

		// Delete the page
		await requestUtils.deletePage( newPage.id );
	} );
} );

function getRandomInt( max ) {
	return Math.floor( Math.random() * max );
}
