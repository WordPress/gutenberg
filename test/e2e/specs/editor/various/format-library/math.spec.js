/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Format Library - Math', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should insert math format with LaTeX', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add a paragraph block
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();

		// Type some text
		await page.keyboard.type( 'equation: ' );

		// Access Math format via More menu
		await editor.clickBlockToolbarButton( 'More' );
		await page.getByRole( 'menuitem', { name: 'Math' } ).click();

		// Type LaTeX in the popover input
		const mathInput = page.locator(
			'.block-editor-format-toolbar__math-input input'
		);
		await mathInput.fill( 'x^2' );

		// Verify the block contains math element with data-latex attribute
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'equation: <math data-latex="x^2"><semantics><msup><mi>x</mi><mn>2</mn></msup><annotation encoding="application/x-tex">x^2</annotation></semantics></math>',
				},
			},
		] );

		// Test arrow key navigation around math element
		// Shift+Tab to move focus out of the input
		await pageUtils.pressKeys( 'shift+Tab' );

		// Arrow left to move cursor before the math element
		await page.keyboard.press( 'ArrowLeft' );

		// Type text before the math
		await page.keyboard.type( 'a' );

		// Verify text is before the math
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'equation: a<math data-latex="x^2"><semantics><msup><mi>x</mi><mn>2</mn></msup><annotation encoding="application/x-tex">x^2</annotation></semantics></math>',
				},
			},
		] );

		// Arrow right to move cursor after the math element
		await page.keyboard.press( 'ArrowRight' );

		// Type text after the math
		await page.keyboard.type( 'b' );

		// Verify text is after the math
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'equation: a<math data-latex="x^2"><semantics><msup><mi>x</mi><mn>2</mn></msup><annotation encoding="application/x-tex">x^2</annotation></semantics></math>b',
				},
			},
		] );

		await pageUtils.pressKeys( 'ArrowLeft' );

		// Test selecting and clearing math element
		// Shift+ArrowLeft to select the math element (cursor is already after it)
		await pageUtils.pressKeys( 'shift+ArrowLeft' );

		// Shift+Tab to focus into the input
		await page.keyboard.press( 'Tab' );

		// Empty the content
		await page.keyboard.press( 'Backspace' );

		// Verify the math element is removed
		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'equation: ab',
				},
			},
		] );
	} );
} );
