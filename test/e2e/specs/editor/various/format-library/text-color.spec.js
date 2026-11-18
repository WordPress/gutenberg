const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Format Library - Text color', () => {
	// The presets picked below are the active theme's, and not every spec that
	// switches theme switches back.
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should set and remove a text color', async ( {
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
			.getByRole( 'menuitemcheckbox', { name: 'Text color' } )
			.click();

		// Use a color name with multiple words to ensure that it becomes
		// active. Previously we had a broken regular expression.
		const color = page
			.getByRole( 'listbox', { name: 'Custom color picker' } )
			.getByRole( 'option', { name: 'Dark gray' } );

		await color.click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'<mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-dark-gray-color">1</mark>',
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

	test( 'should set and remove a highlight color', async ( {
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
			.getByRole( 'menuitemcheckbox', { name: 'Highlight color' } )
			.click();

		const color = page
			.getByRole( 'listbox', { name: 'Custom color picker' } )
			.getByRole( 'option', { name: 'Dark gray' } );

		await color.click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'<mark style="background-color:#28303D" class="has-inline-color">1</mark>',
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
