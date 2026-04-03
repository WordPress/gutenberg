/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Revision Block Diff Panel', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should show changed attributes when alignment changes', async ( {
		editor,
		page,
	} ) => {
		// Insert a paragraph with left alignment.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Test paragraph',
				align: 'left',
			},
		} );

		// Save draft to create first revision.
		await editor.saveDraft();

		// Change alignment to wide.
		await page.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			window.wp.data
				.dispatch( 'core/block-editor' )
				.updateBlockAttributes( blocks[ 0 ].clientId, {
					align: 'wide',
				} );
		} );

		// Save draft again to create second revision.
		await editor.saveDraft();

		// Open revisions.
		await editor.openDocumentSettingsSidebar();
		const settingsSidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settingsSidebar.getByRole( 'tab', { name: 'Post' } ).click();
		await settingsSidebar
			.getByRole( 'button', { name: '2', exact: true } )
			.click();

		// Wait for revisions mode.
		await expect(
			page.getByRole( 'button', { name: 'Restore' } )
		).toBeVisible();

		// Click on the paragraph block in the revision canvas.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();

		// Switch to the Block tab in the sidebar.
		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await sidebar.getByRole( 'tab', { name: 'Block' } ).click();

		// Verify the Changed attributes panel is visible with the align attribute.
		const panelToggle = sidebar.getByRole( 'button', {
			name: 'Changed attributes',
		} );
		await expect( panelToggle ).toBeVisible();
		const attributesPanel = panelToggle.locator(
			'xpath=ancestor::div[contains(@class,"components-panel__body")]'
		);
		await expect( attributesPanel.getByText( 'align' ) ).toBeVisible();
	} );

	test( 'should not show rich-text attributes in the diff panel', async ( {
		editor,
		page,
	} ) => {
		// Insert a paragraph.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Original text', dropCap: false },
		} );

		// Save draft to create first revision.
		await editor.saveDraft();

		// Change the content and dropCap.
		await page.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			window.wp.data
				.dispatch( 'core/block-editor' )
				.updateBlockAttributes( blocks[ 0 ].clientId, {
					content: 'Updated text',
					dropCap: true,
				} );
		} );

		// Save draft again.
		await editor.saveDraft();

		// Open revisions.
		await editor.openDocumentSettingsSidebar();
		const settingsSidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settingsSidebar.getByRole( 'tab', { name: 'Post' } ).click();
		await settingsSidebar
			.getByRole( 'button', { name: '2', exact: true } )
			.click();

		await expect(
			page.getByRole( 'button', { name: 'Restore' } )
		).toBeVisible();

		// Click on the paragraph block.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();

		// Switch to Block tab.
		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await sidebar.getByRole( 'tab', { name: 'Block' } ).click();

		// The Changed attributes panel should show dropCap but not content.
		const panelToggle = sidebar.getByRole( 'button', {
			name: 'Changed attributes',
		} );
		await expect( panelToggle ).toBeVisible();
		const attributesPanel = panelToggle.locator(
			'xpath=ancestor::div[contains(@class,"components-panel__body")]'
		);
		await expect( attributesPanel.getByText( 'dropCap' ) ).toBeVisible();

		// The "content" rich-text attribute should NOT have its own row label.
		// PostPanelRow renders the label in a span, so check there's no row for it.
		await expect(
			attributesPanel.locator(
				'.editor-post-panel__row-label:text-is("content")'
			)
		).toHaveCount( 0 );
	} );
} );
