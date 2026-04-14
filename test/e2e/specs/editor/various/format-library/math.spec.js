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
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();

		await page.keyboard.type( 'equation: ' );

		await editor.clickBlockToolbarButton( 'More' );
		await page.getByRole( 'menuitem', { name: 'Math' } ).click();

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'equation: ',
				},
			},
		] );

		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'x^2' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'equation: <math data-latex="x^2"><semantics><msup><mi>x</mi><mn>2</mn></msup><annotation encoding="application/x-tex">x^2</annotation></semantics></math>',
				},
			},
		] );

		// Test typing before.
		await pageUtils.pressKeys( 'shift+Tab' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( 'a' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'equation: a<math data-latex="x^2"><semantics><msup><mi>x</mi><mn>2</mn></msup><annotation encoding="application/x-tex">x^2</annotation></semantics></math>',
				},
			},
		] );

		// Test typing after.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'b' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'equation: a<math data-latex="x^2"><semantics><msup><mi>x</mi><mn>2</mn></msup><annotation encoding="application/x-tex">x^2</annotation></semantics></math>b',
				},
			},
		] );

		// Test removing math element.
		await pageUtils.pressKeys( 'ArrowLeft' );
		await pageUtils.pressKeys( 'shift+ArrowLeft' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Backspace' );

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
