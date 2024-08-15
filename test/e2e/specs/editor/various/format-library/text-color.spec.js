/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Format Library - Text color', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should remove highlighting element', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();

		await page.keyboard.type( '1' );
		await pageUtils.pressKeys( 'primary+a' );
		await editor.clickBlockToolbarButton( 'More' );
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Highlight' } )
			.click();

		// Use a color name with multiple words to ensure that it becomes
		// active. Previously we had a broken regular expression.
		const color = page
			.getByRole( 'listbox', { name: 'Custom color picker' } )
			.getByRole( 'option', { name: 'Color: Cyan bluish gray' } );

		await color.click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'<mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-cyan-bluish-gray-color">1</mark>',
				},
			},
		] );

		await color.click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: '1',
				},
			},
		] );
	} );
} );
