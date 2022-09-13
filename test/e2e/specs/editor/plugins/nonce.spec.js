/**
 * WordPress dependencies
 */
/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Nonce', () => {
	// While using beforeEach/afterEach is suboptimal for multiple tests, they
	// are used here to ensure that the nonce plugin doesn't interfere with API
	// calls made in global before/after calls, which may perform API requests.
	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-plugin-nonce' );
	} );
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-plugin-nonce' );
	} );

	test( 'should refresh when expired', async ( { page, admin } ) => {
		await admin.createNewPost();
		await page.keyboard.press( 'Enter' );
		// eslint-disable-next-line no-restricted-syntax
		await page.waitForTimeout( 5000 );
		await page.keyboard.type( 'test' );
		// Click on save draft button so that this test would
		// timeout if it's not.
		await page.click( 'role=button[name=/Save draft/i]' );
		// We expect a 403 status once.
		page.on( 'console', ( message ) => {
			expect( message.type() ).toBe( 'error' );
		} );
	} );
} );
