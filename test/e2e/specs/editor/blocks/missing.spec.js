/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'missing block', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should strip potentially malicious on* attributes', async ( {
		editor,
		page,
	} ) => {
		let hasAlert = false;

		page.on( 'dialog', () => {
			hasAlert = true;
		} );

		await editor.setContent(
			`<!-- wp:non-existing-block-here --><img src onerror=alert(1)>`
		);

		// Give the browser time to show the alert.
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );

		expect( hasAlert ).toBe( false );
	} );

	test( 'should strip potentially malicious script tags', async ( {
		editor,
		page,
	} ) => {
		let hasAlert = false;

		page.on( 'dialog', () => {
			hasAlert = true;
		} );

		await editor.setContent(
			`<!-- wp:non-existing-block-here --><script>alert("EVIL");</script>`
		);

		// Give the browser time to show the alert.
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );

		expect( hasAlert ).toBe( false );
	} );
} );
