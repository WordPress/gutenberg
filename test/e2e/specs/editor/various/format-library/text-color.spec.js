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
			.getByRole( 'document', { name: 'Add default block' } )
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
			.getByRole( 'option', { name: 'Cyan bluish gray' } );

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

	test( 'should not nest mark elements on paste', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Create first paragraph with highlight
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();

		await page.keyboard.type( "I'll give this a highlight." );
		await pageUtils.pressKeys( 'primary+a' );
		await editor.clickBlockToolbarButton( 'More' );
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Highlight' } )
			.click();

		const color1 = page
			.getByRole( 'listbox', { name: 'Custom color picker' } )
			.getByRole( 'option', { name: 'Vivid red' } );

		await color1.click();
		await page.keyboard.press( 'Escape' );

		// Create second paragraph with different highlight
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( "I'll give this another inline style." );
		await pageUtils.pressKeys( 'primary+a' );
		await editor.clickBlockToolbarButton( 'More' );
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Highlight' } )
			.click();

		const color2 = page
			.getByRole( 'listbox', { name: 'Custom color picker' } )
			.getByRole( 'option', { name: 'Cyan bluish gray' } );

		await color2.click();
		await page.keyboard.press( 'Escape' );

		// Create third paragraph with yet another highlight
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'And a third.' );
		await pageUtils.pressKeys( 'primary+a' );
		await editor.clickBlockToolbarButton( 'More' );
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Highlight' } )
			.click();

		const color3 = page
			.getByRole( 'listbox', { name: 'Custom color picker' } )
			.getByRole( 'option', { name: 'Vivid green cyan' } );

		await color3.click();
		await page.keyboard.press( 'Escape' );

		// Navigate back to first paragraph, select all and copy
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+a' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+c' );

		// Navigate to third paragraph, select all and paste
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+v' );

		// Check that the result doesn't have nested marks
		const blocks = await editor.getBlocks();
		const thirdParagraph = blocks[ 2 ];

		// The content should have only one mark element, not nested ones
		expect( thirdParagraph.attributes.content ).not.toMatch(
			/<mark[^>]*>[\s\S]*<mark/
		);

		// The text should still be present
		expect( thirdParagraph.attributes.content ).toContain(
			"I'll give this a highlight."
		);

		// There should be a mark element
		expect( thirdParagraph.attributes.content ).toMatch( /<mark/ );
	} );
} );
} );
