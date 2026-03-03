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
				.filter( { hasText: 'Restored to revision' } )
		).toBeVisible();

		// Verify the original content is restored.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Original content' },
			},
		] );
	} );

	test( 'should preserve block clientId when sliding between revisions', async ( {
		editor,
		page,
	} ) => {
		// Add a heading.
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'Test Heading' },
		} );

		// Save draft to create first revision.
		await editor.saveDraft();

		// Add a paragraph at the start (before the heading).
		await page.evaluate( () => {
			const block = window.wp.blocks.createBlock( 'core/paragraph', {
				content: 'New paragraph',
			} );
			window.wp.data
				.dispatch( 'core/block-editor' )
				.insertBlock( block, 0 );
		} );

		// Verify blocks are correctly configured.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'New paragraph' },
			},
			{
				name: 'core/heading',
				attributes: { content: 'Test Heading' },
			},
		] );

		// Save draft again to create second revision.
		await editor.saveDraft();

		// Open the post settings sidebar and click the Revisions button.
		await editor.openDocumentSettingsSidebar();
		const settingsSidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settingsSidebar.getByRole( 'tab', { name: 'Post' } ).click();
		await settingsSidebar
			.getByRole( 'button', { name: '2', exact: true } )
			.click();

		// Wait for the revisions mode to be active.
		await expect(
			page.getByRole( 'button', { name: 'Restore' } )
		).toBeVisible();

		// Get the heading block's clientId before sliding.
		const headingBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Heading',
		} );
		const clientIdBefore = await headingBlock.getAttribute( 'data-block' );

		// Use the slider to navigate to the oldest revision.
		const slider = page.getByRole( 'slider', { name: 'Revision' } );
		await slider.focus();
		await page.keyboard.press( 'Home' );

		// Verify the heading's clientId is preserved (prevents flashing).
		const clientIdAfter = await headingBlock.getAttribute( 'data-block' );
		expect( clientIdAfter ).toBe( clientIdBefore );
	} );
} );
