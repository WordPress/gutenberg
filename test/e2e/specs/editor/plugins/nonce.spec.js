/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Nonce', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-plugin-nonce' );
	} );
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-plugin-nonce' );
	} );

	test( 'should refresh when expired', async ( { page, admin } ) => {
		await admin.createNewPost();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'test' );

		// Saving draft should still succeed.
		await page.click( 'role=button[name=/Save draft/i]' );
		await expect(
			page.locator( 'role=button[name="Dismiss this notice"i]' )
		).toContainText( /Draft saved/i );

		// We expect a 403 status once.
		page.on( 'console', ( message ) => {
			expect( message.type() ).toBe( 'error' );
		} );
	} );
} );
