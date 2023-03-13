/**
 * WordPress dependencies
 */
const { test } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Autosave', () => {
	test( 'should save to sessionStorage', async () => {} );
	test( 'should recover from sessionStorage', async () => {} );
	test( 'should recover from sessionStorage', async () => {} );
	test( "shouldn't contaminate other posts", async () => {} );
	test( 'should clear local autosave after successful remote autosave', async () => {} );
	test( "shouldn't clear local autosave if remote autosave fails", async () => {} );
	test( 'should clear local autosave after successful save', async () => {} );
	test( "shouldn't clear local autosave if save fails", async () => {} );
	test( "shouldn't conflict with server-side autosave", async () => {} );
	test( 'should clear sessionStorage upon user logout', async () => {} );
} );
