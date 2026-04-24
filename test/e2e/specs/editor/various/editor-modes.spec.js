/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Editing modes (visual/HTML)', () => {
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello world!' },
		} );
	} );

	test( 'should switch between visual and HTML modes', async ( {
		editor,
	} ) => {
		const paragraphBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );

		// This block should be in "visual" mode by default.
		await expect( paragraphBlock ).toHaveClass( /rich-text/ );

		// Change editing mode from "Visual" to "HTML".
		await editor.clickBlockOptionsMenuItem( 'Edit as HTML' );

		// Wait for the block to be converted to HTML editing mode.
		await expect( paragraphBlock.getByRole( 'textbox' ) ).toBeVisible();

		// Change editing mode from "HTML" back to "Visual".
		await editor.clickBlockOptionsMenuItem( 'Edit visually' );

		// This block should be in "visual" mode again.
		await expect( paragraphBlock ).toHaveClass( /rich-text/ );
	} );

	test( 'should display sidebar in HTML mode', async ( { editor, page } ) => {
		await editor.clickBlockOptionsMenuItem( 'Edit as HTML' );
		await editor.openDocumentSettingsSidebar();

		// The `drop cap` toggle for the paragraph block should appear, even in
		// HTML editing mode.
		await page
			.getByRole( 'button', { name: 'Typography options' } )
			.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show Drop cap' } )
			.click();

		await expect(
			page.getByRole( 'checkbox', { name: 'Drop cap' } )
		).toBeVisible();
	} );

	test( 'should update HTML in HTML mode when sidebar is used', async ( {
		editor,
		page,
	} ) => {
		await editor.clickBlockOptionsMenuItem( 'Edit as HTML' );
		await editor.openDocumentSettingsSidebar();

		const paragraphHTML = editor.canvas
			.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
			.getByRole( 'textbox' );

		// Make sure the paragraph content is rendered as expected.
		await expect( paragraphHTML ).toHaveValue( '<p>Hello world!</p>' );

		// Change the `drop cap` using the sidebar.
		await page
			.getByRole( 'button', { name: 'Typography options' } )
			.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show Drop cap' } )
			.click();
		await page.getByRole( 'checkbox', { name: 'Drop cap' } ).check();

		// Make sure the HTML content updated.
		await expect( paragraphHTML ).toHaveValue(
			'<p class="has-drop-cap">Hello world!</p>'
		);
	} );

	test( 'the code editor should unselect blocks and disable the inserter', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.openDocumentSettingsSidebar();
		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		const activeTab = editorSettings.getByRole( 'tab', { selected: true } );

		// The Block inspector should be active.
		await expect( activeTab ).toHaveText( 'Block' );
		await expect(
			editorSettings.locator( '.block-editor-block-card__title' )
		).toHaveText( 'Paragraph' );

		// Open the code editor.
		await pageUtils.pressKeys( 'secondary+M' );

		// The Block inspector should not be active anymore.
		await expect( activeTab ).not.toHaveText( 'Block' );

		await editorSettings.getByRole( 'tab', { name: 'Block' } ).click();
		await expect(
			editorSettings.locator( '.block-editor-block-inspector__no-blocks' )
		).toHaveText( 'No block selected.' );

		await expect(
			page
				.getByRole( 'toolbar', { name: 'Document tools' } )
				.getByRole( 'button', { name: 'Block Inserter', exact: true } )
		).toBeDisabled();

		// Go back to the visual editor.
		await pageUtils.pressKeys( 'secondary+M' );
	} );

	// Test for regressions of https://github.com/WordPress/gutenberg/issues/24054.
	test( 'saves content when using the shortcut in the Code Editor', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Open the code editor.
		await pageUtils.pressKeys( 'secondary+M' );

		// Change content.
		await page.getByRole( 'textbox', { name: 'Type text or HTML' } )
			.fill( `<!-- wp:paragraph -->
<p>Hi world!</p>
<!-- /wp:paragraph -->` );

		// Save the post using the shortcut.
		await pageUtils.pressKeys( 'primary+s' );
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Draft saved' } )
		).toBeVisible();

		// Go back to the visual editor.
		await pageUtils.pressKeys( 'secondary+M' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Hi world!' },
			},
		] );
	} );

	test( 'should reparse changes from code editor', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Open the code editor.
		await pageUtils.pressKeys( 'secondary+M' );

		// Change the content.
		await page.getByRole( 'textbox', { name: 'Type text or HTML' } )
			.fill( `<!-- wp:paragraph -->
<p>abc</p>
<!-- /wp:paragraph -->` );

		// Go back to the visual editor.
		await pageUtils.pressKeys( 'secondary+M' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'abc' },
			},
		] );
	} );
} );
