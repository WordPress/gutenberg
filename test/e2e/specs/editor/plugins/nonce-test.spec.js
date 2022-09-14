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

	test( 'should refresh when expired', async ( { admin, page } ) => {
		await admin.createNewPost();
		await page.keyboard.press( 'Enter' );

		await page.keyboard.type( 'test' );

		// `save Draft` waits for saving to be successful, so this test would timeout if it's not.
		await page.click( 'role=button[name="Save draft"i]' );
		await page.waitForSelector(
			'role=button[name="Dismiss this notice"] >> text=Draft saved'
		);

		// We expect a 403 status once.
		page.on( 'console', ( message ) => {
			expect( message.type() ).toBe( 'error' );
		} );
	} );
} );
