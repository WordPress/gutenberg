const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const CONTENT = `<!-- wp:heading -->
<h2 class="wp-block-heading">Welcome</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Hello</p>
<!-- /wp:paragraph -->`;

test.describe( 'Block hover label', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'shows the name of the hovered block above its top-left corner', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent( CONTENT );

		const heading = editor.canvas.getByRole( 'document', {
			name: 'Block: Heading',
		} );
		await heading.hover();

		const label = page.locator(
			'.block-editor-block-list__block-hover-label'
		);
		await expect( label ).toHaveText( 'Heading 2' );
		// The label is real text for assistive technology, not decoration.
		await expect( label ).not.toHaveAttribute( 'aria-hidden' );

		const [ labelBox, blockBox ] = await Promise.all( [
			label.boundingBox(),
			heading.boundingBox(),
		] );
		expect( Math.abs( labelBox.x - blockBox.x ) ).toBeLessThanOrEqual( 2 );
		expect(
			Math.abs( labelBox.y + labelBox.height - blockBox.y )
		).toBeLessThanOrEqual( 2 );
	} );

	test( 'nests the label inside the block when there is no room above', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent(
			Array.from(
				{ length: 30 },
				( _, i ) => `<!-- wp:paragraph -->
<p>Paragraph ${ i + 1 }</p>
<!-- /wp:paragraph -->`
			).join( '\n\n' )
		);

		const paragraph = editor.canvas.getByText( 'Paragraph 20' );
		// Scroll the block flush with the top of the canvas.
		await paragraph.evaluate( ( element ) =>
			element.scrollIntoView( { block: 'start' } )
		);
		await paragraph.hover();

		const label = page.locator(
			'.block-editor-block-list__block-hover-label'
		);
		await expect( label ).toHaveText( 'Paragraph' );

		const [ labelBox, blockBox ] = await Promise.all( [
			label.boundingBox(),
			paragraph.boundingBox(),
		] );
		expect( Math.abs( labelBox.x - blockBox.x ) ).toBeLessThanOrEqual( 2 );
		expect( Math.abs( labelBox.y - blockBox.y ) ).toBeLessThanOrEqual( 2 );
	} );

	test( 'uses the custom name of a renamed block', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent( `<!-- wp:group {"metadata":{"name":"Hero"},"style":{"spacing":{"padding":{"top":"40px","right":"40px","bottom":"40px","left":"40px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-top:40px;padding-right:40px;padding-bottom:40px;padding-left:40px"><!-- wp:paragraph -->
<p>Hello</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->` );

		// Hover the group's own padding rather than the paragraph inside it.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Group' } )
			.hover( { position: { x: 10, y: 10 } } );

		await expect(
			page.locator( '.block-editor-block-list__block-hover-label' )
		).toHaveText( 'Hero' );
	} );

	test( 'hides the label once the hovered block is selected', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent( CONTENT );

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		const label = page.locator(
			'.block-editor-block-list__block-hover-label'
		);

		await paragraph.hover();
		await expect( label ).toHaveText( 'Paragraph' );

		// The toolbar represents the selection, so the label steps aside.
		await paragraph.click();
		await expect( label ).toBeHidden();

		// Hovering another block names that one.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.hover();
		await expect( label ).toHaveText( 'Heading 2' );
	} );

	test( 'removes the label when the pointer leaves the block', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent( CONTENT );

		const label = page.locator(
			'.block-editor-block-list__block-hover-label'
		);

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.hover();
		await expect( label ).toHaveText( 'Heading 2' );

		await page.mouse.move( 0, 0 );
		await expect( label ).toBeHidden();
	} );

	test( 'does not label the empty default block', async ( {
		editor,
		page,
	} ) => {
		const emptyBlock = editor.canvas.getByRole( 'document', {
			name: 'Add default block',
		} );
		await emptyBlock.hover();

		// The hover registered on the block, and the label commits on the
		// next animation frame, so after two frames it would be showing.
		await expect( emptyBlock ).toHaveClass( /is-hovered/ );
		await page.evaluate(
			() =>
				new Promise( ( resolve ) =>
					window.requestAnimationFrame( () =>
						window.requestAnimationFrame( resolve )
					)
				)
		);
		await expect(
			page.locator( '.block-editor-block-list__block-hover-label' )
		).toHaveCount( 0 );
	} );
} );
