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

	test( 'fills the Stack and Row blocks it is placed in', async ( {
		editor,
	} ) => {
		for ( const layout of [
			{ type: 'flex', orientation: 'vertical' },
			{ type: 'flex', flexWrap: 'nowrap' },
		] ) {
			await editor.insertBlock( {
				name: 'core/group',
				attributes: { layout },
				innerBlocks: [
					{
						name: 'core/separator',
						attributes: { className: 'is-style-wide' },
					},
					{ name: 'core/paragraph', attributes: { content: 'Text' } },
				],
			} );
		}

		const [ stack, row ] = await editor.canvas
			.locator( '[data-type="core/group"]' )
			.all();
		const stackBox = await stack.boundingBox();
		const rowBox = await row.boundingBox();
		const separatorBox = ( group ) =>
			group.locator( '[data-type="core/separator"]' ).boundingBox();
		const paragraphBox = await row
			.locator( '[data-type="core/paragraph"]' )
			.boundingBox();

		// An empty separator used to collapse to a width of zero. In a Stack,
		// it is as wide as the Stack.
		expect( ( await separatorBox( stack ) ).width ).toBeCloseTo(
			stackBox.width,
			0
		);
		// In a Row, it takes the free space next to the paragraph.
		expect( ( await separatorBox( row ) ).width ).toBeGreaterThan( 0 );
		expect( paragraphBox.x + paragraphBox.width ).toBeCloseTo(
			rowBox.x + rowBox.width,
			0
		);
	} );

	test( 'keeps a width of its own inside a Row', async ( { editor } ) => {
		for ( const separatorAttributes of [
			// A width set in Dimensions > Width.
			{
				className: 'is-style-wide',
				style: {
					layout: { selfStretch: 'fixedNoShrink', flexSize: '50px' },
				},
			},
			// The Default style is 100px wide in the theme block styles, which
			// the test theme loads.
			{},
		] ) {
			await editor.insertBlock( {
				name: 'core/group',
				attributes: { layout: { type: 'flex', flexWrap: 'nowrap' } },
				innerBlocks: [
					{
						name: 'core/separator',
						attributes: separatorAttributes,
					},
					{ name: 'core/paragraph', attributes: { content: 'Text' } },
				],
			} );
		}

		const separators = editor.canvas.locator(
			'[data-type="core/separator"]'
		);
		await expect( separators.nth( 0 ) ).toHaveCSS( 'width', '50px' );
		await expect( separators.nth( 1 ) ).toHaveCSS( 'width', '100px' );
	} );
} );
