/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Example sanity check test, should be removed once there are other tests.
test.describe( 'Sanity check', () => {
	test( 'Expect site loaded', async ( { page, pageUtils } ) => {
		await pageUtils.visitAdminPage( '/' );

		await expect( page ).toHaveTitle( /Dashboard/ );
	} );
} );
