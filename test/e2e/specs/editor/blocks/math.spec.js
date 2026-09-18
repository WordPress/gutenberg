const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const ALIGNED = '\\begin{aligned} A &= 1 \\\\ AB + C &= 2 \\end{aligned}';

// In `aligned`, cells before `&` are right-aligned and cells after
// it are left-aligned, so that `A` and `AB + C` both sit against
// their `=`. Returns, for every aligned cell, how far its content is
// from the edge its `columnalign` names; nothing is misaligned when
// all are within a pixel.
async function getMisalignedCells( container ) {
	const cells = container.locator(
		'math mtd[columnalign="right"], math mtd[columnalign="left"]'
	);
	await expect( cells ).toHaveCount( 4 );
	return cells.evaluateAll( ( elements ) =>
		elements
			.map( ( cell ) => {
				const cellRect = cell.getBoundingClientRect();
				const rects = Array.from( cell.children, ( child ) =>
					child.getBoundingClientRect()
				);
				const style = window.getComputedStyle( cell );
				return cell.getAttribute( 'columnalign' ) === 'right'
					? cellRect.right -
							parseFloat( style.paddingRight ) -
							Math.max( ...rects.map( ( r ) => r.right ) )
					: Math.min( ...rects.map( ( r ) => r.left ) ) -
							cellRect.left -
							parseFloat( style.paddingLeft );
			} )
			.filter( ( gap ) => Math.abs( gap ) > 1 )
	);
}

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

	test( 'should align the columns of an aligned environment @webkit @firefox', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/math',
			attributes: { latex: ALIGNED },
		} );
		expect( await getMisalignedCells( editor.canvas ) ).toEqual( [] );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );
		expect( await getMisalignedCells( page ) ).toEqual( [] );
	} );

	test( 'should align inline math without a Math block @webkit @firefox', async ( {
		editor,
		page,
	} ) => {
		// The rules live in the block library's common stylesheet, which
		// loads on every page, not in the Math block's own.
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Inline ' );
		await editor.clickBlockToolbarButton( 'More' );
		await page.getByRole( 'menuitem', { name: 'Math' } ).click();
		await page
			.getByRole( 'textbox', { name: 'LaTeX math syntax' } )
			.fill( ALIGNED );
		expect( await getMisalignedCells( editor.canvas ) ).toEqual( [] );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );
		expect( await getMisalignedCells( page ) ).toEqual( [] );
	} );
} );
