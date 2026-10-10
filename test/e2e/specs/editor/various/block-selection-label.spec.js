const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block selection label', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'shows the name of the selected block at its top-left corner', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const imageBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );
		await expect( imageBlock ).toBeVisible();

		// The label is decorative (the block already announces its name
		// through its accessible name), so it has no role to query by.
		const label = page.locator(
			'.block-editor-block-list__block-selection-label'
		);
		await expect( label ).toHaveText( 'Image' );

		const [ labelBox, blockBox ] = await Promise.all( [
			label.boundingBox(),
			imageBlock.boundingBox(),
		] );
		expect( Math.abs( labelBox.x - blockBox.x ) ).toBeLessThanOrEqual( 2 );
		expect( Math.abs( labelBox.y - blockBox.y ) ).toBeLessThanOrEqual( 2 );
	} );

	test( 'uses the custom name of a renamed block', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent( `<!-- wp:group {"metadata":{"name":"Hero"},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Hello</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->` );

		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Group' } )
		);

		await expect(
			page.locator( '.block-editor-block-list__block-selection-label' )
		).toHaveText( 'Hero' );
	} );

	test( 'hides the label for an empty paragraph and while typing', async ( {
		editor,
		page,
	} ) => {
		const label = page.locator(
			'.block-editor-block-list__block-selection-label'
		);

		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
			.click();

		// An empty default block shows its placeholder instead.
		await expect( label ).toBeHidden();

		await page.keyboard.type( 'Hello' );

		// Typing hides the block UI, including the label.
		await expect( label ).toBeHidden();

		// Moving the mouse ends the typing state and brings the label back.
		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		const box = await paragraph.boundingBox();
		await page.mouse.move( box.x + box.width / 2, box.y + box.height / 2 );
		await page.mouse.move(
			box.x + box.width / 2 + 10,
			box.y + box.height / 2
		);

		await expect( label ).toHaveText( 'Paragraph' );
	} );

	test( 'removes the label when the block is deselected', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent( `<!-- wp:paragraph -->
<p>Hello</p>
<!-- /wp:paragraph -->` );

		const label = page.locator(
			'.block-editor-block-list__block-selection-label'
		);

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await expect( label ).toHaveText( 'Paragraph' );

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.click();
		await expect( label ).toBeHidden();
	} );
} );
