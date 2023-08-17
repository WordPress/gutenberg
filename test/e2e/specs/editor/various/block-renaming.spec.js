/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block Renaming', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'allows renaming of blocks that support the feature', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Create a two blocks on the page.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First Paragraph' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second Paragraph' },
		} );

		// Multiselect via keyboard.
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+a' );

		// Convert to a Group block which supports renaming.
		await editor.clickBlockOptionsMenuItem( 'Group' );

		await editor.clickBlockOptionsMenuItem( 'Rename' );

		const renameModal = page.getByRole( 'dialog', {
			name: 'Rename block',
		} );

		// Check the Modal is perceivable.
		await expect( renameModal ).toBeVisible();

		const saveButton = renameModal.getByRole( 'button', {
			name: 'Save',
			type: 'submit',
		} );

		await expect( saveButton ).toHaveAttribute( 'aria-disabled', 'true' );

		const nameInput = renameModal.getByLabel( 'Block name' );

		await expect( nameInput ).toHaveValue( 'Group' );

		await nameInput.fill( 'My new name' );

		await expect( saveButton ).toHaveAttribute( 'aria-disabled', 'false' );

		await saveButton.click();

		await expect( renameModal ).not.toBeVisible();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/group',
				attributes: {
					metadata: {
						name: 'My new name',
					},
				},
			},
		] );
	} );
} );
