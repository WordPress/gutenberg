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

	test( 'should apply the layout CSS matrices and aligned environments need to render correctly', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/math' } );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type(
			'\\begin{aligned}\nA &= B \\\\[8pt]\nC &= D\n\\end{aligned}'
		);
		await page.keyboard.press( 'Escape' );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const rightAlignedCell = page
			.locator( '.wp-block-math mtd.tml-right' )
			.first();
		await expect( rightAlignedCell ).toBeVisible();

		const textAlign = await rightAlignedCell.evaluate(
			( element ) => window.getComputedStyle( element ).textAlign
		);
		expect( [ 'right', '-webkit-right' ] ).toContain( textAlign );

		const jotCell = page
			.locator( '.wp-block-math mtable.tml-jot mtd' )
			.first();
		const paddingTop = await jotCell.evaluate(
			( element ) => window.getComputedStyle( element ).paddingTop
		);
		expect( paddingTop ).not.toBe( '0px' );
	} );

	test( 'should render a pmatrix/vmatrix as a full-width block, not inline', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/math' } );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type(
			'\\begin{pmatrix}\n1 & 2 \\\\\n3 & 4\n\\end{pmatrix}'
		);
		await page.keyboard.press( 'Escape' );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const mathElement = page.locator( '.wp-block-math math' ).first();
		await expect( mathElement ).toBeVisible();

		const display = await mathElement.evaluate(
			( element ) => window.getComputedStyle( element ).display
		);
		expect( display ).toBe( 'block' );

		const mtable = page.locator( '.wp-block-math mtable' ).first();
		await expect( mtable ).toBeVisible();
	} );
} );
