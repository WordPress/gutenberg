/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Revision Fields Diff Panel', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should show only the revision footnotes, not the current post footnotes', async ( {
		editor,
		page,
	} ) => {
		// Revision 1: paragraph with footnote "alpha".
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Paragraph one' );
		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'More' );
		await page.getByRole( 'menuitem', { name: 'Footnote' } ).click();
		await page.keyboard.type( 'alpha' );
		await editor.saveDraft();

		// Revision 2: add a second paragraph with footnote "beta".
		// Insert programmatically to avoid focus issues with footnotes block.
		await page.evaluate( () => {
			const block = window.wp.blocks.createBlock( 'core/paragraph', {
				content: 'Paragraph two',
			} );
			window.wp.data
				.dispatch( 'core/block-editor' )
				.insertBlock( block, 1 );
		} );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.nth( 1 )
			.click();
		await page.keyboard.press( 'End' );
		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'More' );
		await page.getByRole( 'menuitem', { name: 'Footnote' } ).click();
		await page.keyboard.type( 'beta' );
		await editor.saveDraft();

		// Open revisions UI.
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

		// Expand the Meta panel.
		await settingsSidebar.getByRole( 'button', { name: 'Meta' } ).click();

		const footnotesRow = settingsSidebar.locator(
			'.editor-post-panel__row',
			{
				has: page.locator(
					'.editor-post-panel__row-label:text("footnotes")'
				),
			}
		);
		const footnotesControl = footnotesRow.locator(
			'.editor-post-panel__row-control'
		);

		// Latest revision (2 footnotes) diffs against rev 1 (1 footnote).
		// Should contain both "alpha" and "beta".
		await expect( footnotesControl ).toContainText( 'alpha' );
		await expect( footnotesControl ).toContainText( 'beta' );

		// Navigate to oldest revision.
		const slider = page.getByRole( 'slider', { name: 'Revision' } );
		await slider.focus();
		await page.keyboard.press( 'Home' );

		// Oldest revision (1 footnote) has no previous revision.
		// Should only contain "alpha", NOT "beta".
		await expect( footnotesControl ).toContainText( 'alpha' );
		await expect( footnotesControl ).not.toContainText( 'beta' );
	} );
} );
