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

		// Navigate to the iframe
		await pageUtils.pressKeys( 'Tab', { times: 3 } );
		// Open the command palette via button press
		await expect( page.getByLabel( 'Open command palette' ) ).toBeFocused();
		await pageUtils.pressKeys( 'Enter' );
		await expect(
			page.getByPlaceholder( 'Search for commands' )
		).toBeFocused();
		// Return focus to the button
		await pageUtils.pressKeys( 'Escape' );
		await expect( page.getByLabel( 'Open command palette' ) ).toBeFocused();
		// Open it again with Command + K
		await pageUtils.pressKeys( 'primary+k' );
		await expect(
			page.getByPlaceholder( 'Search for commands' )
		).toBeFocused();
		await pageUtils.pressKeys( 'Escape' );
		await expect( page.getByLabel( 'Open command palette' ) ).toBeFocused();
		// Go to the Pages button
		await pageUtils.pressKeys( 'Tab', { times: 4 } );
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
		await pageUtils.pressKeys( 'Tab', { times: 6 } );
		// Getting the actual iframe as a cleaner locator was suprisingly tricky,
		// so we're using a css selector with .is-focused which should be present when the iframe has focus.
		await expect(
			page.locator( 'iframe[name="editor-canvas"].is-focused' )
		).toBeFocused();

		// Enter into editing mode
		await pageUtils.pressKeys( 'Enter' );

		// We should now be in editing mode
		await pageUtils.pressKeys( 'Shift+Tab', { times: 9 } );

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
