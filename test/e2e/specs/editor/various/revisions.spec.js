/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Revisions', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should restore an older revision', async ( { editor, page } ) => {
		// Add title and original content.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Revisions Test' );

		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Original content' );

		// Save draft to create first revision.
		await editor.saveDraft();

		// Edit the paragraph to new content.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' - Updated content' );

		// Save draft again to create second revision.
		await editor.saveDraft();

		// Open the post settings sidebar and click the Revisions button.
		await editor.openDocumentSettingsSidebar();
		const settingsSidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		// Ensure Post tab is selected in sidebar.
		await settingsSidebar.getByRole( 'tab', { name: 'Post' } ).click();

		// Click the Revisions button (the button shows the revision count "2").
		await settingsSidebar.getByRole( 'button', { name: '2' } ).click();

		// Wait for the revisions mode to be active (Restore button appears).
		const restoreButton = page.getByRole( 'button', { name: 'Restore' } );
		await expect( restoreButton ).toBeVisible();

		// Verify the current (updated) content is displayed in revisions preview.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveText( 'Original content - Updated content' );

		// Use the slider to navigate to the oldest revision.
		const slider = page.getByRole( 'slider', { name: 'Revision' } );
		await slider.focus();
		await page.keyboard.press( 'Home' );

		// Verify the original content is now displayed in revisions preview.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveText( 'Original content' );

		// Click the Restore button.
		await restoreButton.click();

		// Verify the success notice.
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Revision restored' } )
		).toBeVisible();

		// Verify the original content is restored.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Original content' },
			},
		] );
	} );
} );
