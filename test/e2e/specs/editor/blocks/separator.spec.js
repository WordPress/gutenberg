const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Separator', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by three dashes', async ( { editor, page } ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		// Should be able to keep typing after the separator transform.
		await page.keyboard.type( '---a' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/separator',
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: 'a',
				},
			},
		] );
	} );

	test( 'is not created by three dashes when the block cannot be replaced', async ( {
		editor,
		page,
	} ) => {
		// A block that cannot be removed is passed an undefined `onReplace`,
		// so there is no way to swap it for a separator.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { lock: { remove: true, move: false } },
		} );

		await editor.canvas
			.getByRole( 'document', {
				name: 'Empty block; start writing or type forward slash to choose a block',
			} )
			.click();
		await page.keyboard.type( '---' );

		// The dashes are left alone as text.
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ name: 'core/paragraph', attributes: { content: '---' } },
			] );
	} );
} );
