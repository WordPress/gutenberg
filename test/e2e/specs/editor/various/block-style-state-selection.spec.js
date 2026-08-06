/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block pseudo-state selection', () => {
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [
				{
					name: 'core/button',
					attributes: { text: 'Click me' },
				},
			],
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'keeps the selected pseudo-state when the caret moves within the block', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		const buttonText = editor.canvas.getByRole( 'textbox', {
			name: 'Button text',
		} );
		await buttonText.click();

		// Switch the block's editing context to the Hover pseudo-state.
		await page.getByRole( 'button', { name: 'State: Default' } ).click();
		await page.getByRole( 'menuitem', { name: 'Hover' } ).click();
		await page.keyboard.press( 'Escape' );

		const hoverToggle = page.getByRole( 'button', {
			name: 'State: Hover',
		} );
		await expect( hoverToggle ).toBeVisible();

		// Clicking the button's label to edit it dispatches a rich text
		// selection change, which used to clear the selected pseudo-state.
		await buttonText.click();

		await expect( hoverToggle ).toBeVisible();
	} );

	test( 'clears the selected pseudo-state when another block is selected', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'A paragraph' },
		} );
		await editor.openDocumentSettingsSidebar();

		const buttonText = editor.canvas.getByRole( 'textbox', {
			name: 'Button text',
		} );
		await buttonText.click();

		await page.getByRole( 'button', { name: 'State: Default' } ).click();
		await page.getByRole( 'menuitem', { name: 'Hover' } ).click();
		await page.keyboard.press( 'Escape' );

		await expect(
			page.getByRole( 'button', { name: 'State: Hover' } )
		).toBeVisible();

		// Selecting a different block resets the state.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await buttonText.click();

		await expect(
			page.getByRole( 'button', { name: 'State: Default' } )
		).toBeVisible();
	} );
} );
