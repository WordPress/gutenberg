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

		await page.evaluate( () => {
			window.wp.blocks.registerBlockType( 'test/v1', {
				apiVersion: 1,
				title: 'Test V1 Block',
				edit: () =>
					window.wp.element.createElement( 'p', null, 'v1 block' ),
				save: () => null,
			} );
		} );

		// The editor should still be iframed.
		await expect( iframe ).toBeVisible();

		// Insert the v1 block.
		await editor.insertBlock( { name: 'test/v1' } );

		// The editor should no longer be iframed.
		await expect( iframe ).toBeHidden();
	} );
} );
