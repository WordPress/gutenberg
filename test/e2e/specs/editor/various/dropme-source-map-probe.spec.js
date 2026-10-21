const { test } = require( '@wordpress/e2e-test-utils-playwright' );

/*
 * Each test fails with an error thrown inside the minified `wp-blocks` bundle,
 * so the report shows whether the stack trace is mapped to the sources.
 */
test.describe( 'DROPME: source map probe', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'error thrown in page.evaluate()', async ( { page } ) => {
		await page.evaluate( () => window.wp.blocks.serialize( [ null ] ) );
	} );

	test( 'uncaught error in the page', async ( { page } ) => {
		const pageError = page.waitForEvent( 'pageerror' );
		await page.evaluate( () => {
			setTimeout( () => window.wp.blocks.serialize( [ null ] ) );
		} );
		throw await pageError;
	} );
} );
