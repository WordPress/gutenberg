/**
 * WordPress dependencies
 */

const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Validate multiple use', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should display correct number of warning messages', async ( {
		editor,
		pageUtils,
	} ) => {
		// Insert a block with the `multiple` feature enabled, such as `core/more`
		await editor.insertBlock( {
			name: 'core/more',
		} );

		// Group the block
		await pageUtils.pressKeys( 'primary+a' );
		await editor.clickBlockOptionsMenuItem( 'Group' );

		// Duplicate the block
		await pageUtils.pressKeys( 'primary+a' );
		await editor.clickBlockOptionsMenuItem( 'Duplicate' );

		// Check if warning is visible
		await expect(
			editor.canvas.getByRole( 'button', {
				name: 'Find original',
			} )
		).toBeVisible();
	} );
} );
