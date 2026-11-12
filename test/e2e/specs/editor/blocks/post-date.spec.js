const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Date', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'saves the date it was inserted on', async ( { editor, page } ) => {
		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '/date' );
		await expect(
			page.getByRole( 'option', { name: 'Date', exact: true } )
		).toHaveAttribute( 'aria-selected', 'true' );

		const before = Date.now();
		await page.keyboard.press( 'Enter' );

		const [ { name, attributes } ] = await editor.getBlocks();
		expect( name ).toBe( 'core/post-date' );
		expect( attributes ).toEqual( {
			isLink: false,
			datetime: expect.any( String ),
		} );
		expect(
			new Date( attributes.datetime ).getTime()
		).toBeGreaterThanOrEqual( before );
	} );

	test( 'saves the date it was inserted on inside another block', async ( {
		editor,
	} ) => {
		const before = Date.now();
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [ { name: 'core/post-date' } ],
		} );

		const [
			{
				innerBlocks: [ { attributes } ],
			},
		] = await editor.getBlocks();
		expect(
			new Date( attributes.datetime ).getTime()
		).toBeGreaterThanOrEqual( before );
	} );
} );
