/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor navigation', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Can use keyboard to navigate the site editor', async ( {
		admin,
		page,
		pageUtils,
	} ) => {
		await admin.visitSiteEditor();

		// Test: Can navigate to a sidebar item and into its subnavigation frame without losing focus
		// Go to the Pages button
		await pageUtils.pressKeys( 'Tab', { times: 7 } );
		await expect(
			page.getByRole( 'button', { name: 'Pages' } )
		).toBeFocused();
		await pageUtils.pressKeys( 'Enter' );
		// We should be in the Pages sidebar
		await expect(
			page.getByRole( 'button', { name: 'Back', exact: true } )
		).toBeFocused();
		await pageUtils.pressKeys( 'Enter' );
		// Go back to the main navigation
		await expect(
			page.getByRole( 'button', { name: 'Pages' } )
		).toBeFocused();

		// Test: Can navigate into the iframe using the keyboard
		await pageUtils.pressKeys( 'Tab', { times: 6 } );
		// Getting the actual iframe as a cleaner locator was suprisingly tricky,
		// so we're using a css selector with .is-focused which should be present when the iframe has focus.
		await expect(
			page.locator( 'iframe[name="editor-canvas"].is-focused' )
		).toBeFocused();
		// Enter into the site editor frame
		await pageUtils.pressKeys( 'Enter' );
		// Focus should still be on the iframe.
		await expect(
			page.locator( 'iframe[name="editor-canvas"]' )
		).toBeFocused();
		// But did it do anything?
		// Test to make sure a Tab keypress works as expected.
		// As of this writing, we are in select mode and a tab
		/// keypress will reveal the header template select mode
		// button. This test is not documenting that we _want_
		// that action, but checking that we are within the site
		// editor and keypresses work as intened.
		await pageUtils.pressKeys( 'Tab' );
		await expect(
			page.getByRole( 'button', {
				name: 'Template Part Block. Row 1. header',
			} )
		).toBeFocused();

		// Test: We can go back to the main navigation from the editor frame
		// Move to the document toolbar
		await pageUtils.pressKeys( 'alt+F10' );
		// Go to the open navigation button
		await pageUtils.pressKeys( 'shift+Tab' );

		// Open the sidebar again
		await expect(
			page.getByRole( 'button', {
				name: 'Open Navigation',
				exact: true,
			} )
		).toBeFocused();
		await pageUtils.pressKeys( 'Enter' );

		await expect(
			page.getByLabel( 'Go to the Dashboard' ).first()
		).toBeFocused();
	} );
} );
