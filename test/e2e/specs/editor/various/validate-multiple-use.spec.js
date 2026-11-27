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

	test( 'should omit the Remove button when the duplicate block cannot be removed', async ( {
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/more',
		} );
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [
				{
					name: 'core/more',
					attributes: {
						lock: { remove: true, move: true },
					},
				},
			],
		} );

		await expect(
			editor.canvas.getByRole( 'button', {
				name: 'Find original',
			} )
		).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'button', {
				name: 'Remove',
			} )
		).toBeHidden();
	} );
} );
