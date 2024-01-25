/**
 * WordPress dependencies
 */

const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Validate multiple use', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should display correct amount of warning message', async ( {
		editor,
		pageUtils,
	} ) => {
		// Insert a block with `multiple` feature enabled, such as `core/more`
		await editor.insertBlock( {
			name: 'core/more',
		} );

		// Group the block
		await pageUtils.pressKeys( 'primary+a' );
		await editor.clickBlockOptionsMenuItem( 'Group' );

		// Duplicate the block
		await pageUtils.pressKeys( 'primary+a' );
		await editor.clickBlockOptionsMenuItem( 'Duplicate' );

		// Check if warnings is visible
		await expect(
			editor.canvas.getByRole( 'button', {
				name: 'Find original',
			} )
		).toBeVisible();
	} );
} );
