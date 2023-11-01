/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'missing block', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should strip potentially malicious on* attributes', async ( {
		page,
	} ) => {
		let hasAlert = false;

		page.on( 'dialog', () => {
			hasAlert = true;
		} );

		await page.evaluate( () => {
			const block = window.wp.blocks.parse(
				`<!-- wp:non-existing-block-here --><img src onerror=alert(1)>`
			);
			window.wp.data.dispatch( 'core/block-editor' ).resetBlocks( block );
		} );

		// Give the browser time to show the alert.
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );

		expect( hasAlert ).toBe( false );
	} );

	test( 'should strip potentially malicious script tags', async ( {
		page,
	} ) => {
		let hasAlert = false;

		page.on( 'dialog', () => {
			hasAlert = true;
		} );

		await page.evaluate( () => {
			const block = window.wp.blocks.parse(
				`<!-- wp:non-existing-block-here --><script>alert("EVIL");</script>`
			);
			window.wp.data.dispatch( 'core/block-editor' ).resetBlocks( block );
		} );

		// Give the browser time to show the alert.
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );

		expect( hasAlert ).toBe( false );
	} );
} );
