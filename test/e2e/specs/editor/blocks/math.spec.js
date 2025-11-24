/**
 * WordPress dependencies
 */
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

		await expect( page.locator( '[aria-live="polite"]' ) ).toHaveText(
			`Expected 'EOF', got '&' at position 1: &̲x^2`
		);

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
} );
