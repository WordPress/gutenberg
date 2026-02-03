/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Should iframe', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should switch to non-iframe when a v2 block is added', async ( {
		page,
		editor,
	} ) => {
		const iframe = page.locator( 'iframe[name="editor-canvas"]' );

		// Initially, the editor should be iframed (all core blocks are v3).
		await expect( iframe ).toBeVisible();

		// Register a v2 block dynamically.
		await page.evaluate( () => {
			window.wp.blocks.registerBlockType( 'test/v2', {
				apiVersion: 2,
				title: 'Test V2 Block',
				edit: () =>
					window.wp.element.createElement( 'p', null, 'v2 block' ),
				save: () => null,
			} );
		} );

		// Insert the v2 block.
		await editor.insertBlock( { name: 'test/v2' } );

		// The editor should no longer be iframed.
		await expect( iframe ).not.toBeVisible();
	} );
} );
