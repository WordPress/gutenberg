const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Math Block', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should insert math block with LaTeX', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/math' } );

		// Can access the popover.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'x^2' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/math',
				attributes: {
					latex: 'x^2',
				},
			},
		] );

		// Can escape the popover.
		await pageUtils.pressKeys( 'shift+Tab' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'b' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/math',
				attributes: {
					latex: 'x^2',
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: 'b',
				},
			},
		] );

		// Test removing math block.
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( '&' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/math',
				attributes: {
					latex: '&x^2',
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: 'b',
				},
			},
		] );

		// The parsing error is surfaced once the field is blurred.
		await pageUtils.pressKeys( 'shift+Tab' );
		await expect(
			page.getByRole( 'textbox', { name: 'LaTeX math syntax' } )
		).toHaveAccessibleDescription(
			`Expected 'EOF', got '&' at position 1: &̲x^2`
		);

		// Fix syntax error.
		await page.keyboard.press( 'Backspace' );
		// Can delete the math block.
		await pageUtils.pressKeys( 'shift+Tab' );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'b',
				},
			},
		] );
	} );

	test( 'aligns the columns of an aligned environment @webkit @firefox', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/math',
			attributes: {
				latex: '\\begin{aligned} A &= 1 \\\\ AB + C &= 2 \\end{aligned}',
			},
		} );
		// Wait for the LaTeX to be rendered, then publish.
		await expect(
			editor.canvas.locator( '.wp-block-math mtd.tml-right' ).first()
		).toBeVisible();
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		// In `aligned`, cells before `&` are right-aligned and cells after it
		// are left-aligned: the content of every cell must touch the edge
		// its class names, so that `A` and `AB + C` both sit against `=`.
		const misaligned = await page
			.locator(
				'.wp-block-math mtd.tml-right, .wp-block-math mtd.tml-left'
			)
			.evaluateAll( ( cells ) =>
				cells
					.map( ( cell ) => {
						const cellRect = cell.getBoundingClientRect();
						const rects = Array.from( cell.children, ( child ) =>
							child.getBoundingClientRect()
						);
						const style = window.getComputedStyle( cell );
						return cell.classList.contains( 'tml-right' )
							? cellRect.right -
									parseFloat( style.paddingRight ) -
									Math.max( ...rects.map( ( r ) => r.right ) )
							: Math.min( ...rects.map( ( r ) => r.left ) ) -
									cellRect.left -
									parseFloat( style.paddingLeft );
					} )
					.filter( ( gap ) => Math.abs( gap ) > 1 )
			);
		expect( misaligned ).toEqual( [] );
	} );
} );
