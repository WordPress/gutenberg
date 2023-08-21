/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Columns', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'restricts all blocks inside the columns block', async ( {
		page,
		editor,
	} ) => {
		// Open Columns
		await editor.insertBlock( { name: 'core/columns' } );
		await editor.canvas
			.locator( '[aria-label="Two columns; equal split"]' )
			.click();

		// Open List view toggle
		await page.locator( 'role=button[name="Document Overview"i]' ).click();

		// block column add
		await page
			.locator(
				'role=treegrid[name="Block navigation structure"i] >> role=gridcell[name="Column"i]'
			)
			.first()
			.click();

		// Toggle Block inserter
		await page
			.locator( 'role=button[name="Toggle block inserter"i]' )
			.click();

		// Verify Column
		const inserterOptions = page.locator(
			'role=region[name="Block Library"i] >> role=option'
		);
		await expect( inserterOptions ).toHaveCount( 1 );
		await expect( inserterOptions ).toHaveText( 'Column' );
	} );

	test( 'prevent the removal of locked column block from the column count change UI', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		// Open Columns
		await editor.insertBlock( { name: 'core/columns' } );
		await editor.canvas
			.locator( '[aria-label="Three columns; equal split"]' )
			.click();

		// Lock last column block
		await editor.selectBlocks(
			editor.canvas.locator(
				'role=document[name="Block: Column (3 of 3)"i]'
			)
		);
		await editor.clickBlockToolbarButton( 'Options' );
		await page.click( 'role=menuitem[name="Lock"i]' );
		await page.locator( 'role=checkbox[name="Prevent removal"i]' ).check();
		await page.click( 'role=button[name="Apply"i]' );

		// Select columns block
		await editor.selectBlocks(
			editor.canvas.locator( 'role=document[name="Block: Columns"i]' )
		);
		await editor.openDocumentSettingsSidebar();

		const columnsChangeInput = page.locator(
			'role=spinbutton[name="Columns"i]'
		);

		// The min attribute should take into account locked columns
		await expect( columnsChangeInput ).toHaveAttribute( 'min', '3' );

		// Changing the number of columns should take into account locked columns
		await page.fill( 'role=spinbutton[name="Columns"i]', '1' );
		await pageUtils.pressKeys( 'Tab' );
		await expect( columnsChangeInput ).toHaveValue( '3' );
	} );
	test( 'Ungroup properly', async ( { editor } ) => {
		await editor.insertBlock( {
			name: 'core/columns',
			innerBlocks: [
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '1' },
						},
					],
				},
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '2' },
						},
					],
				},
			],
		} );
		await editor.clickBlockOptionsMenuItem( 'Ungroup' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '1' },
			},
			{
				name: 'core/paragraph',
				attributes: { content: '2' },
			},
		] );
	} );

	test( 'can exit on Enter', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/columns',
			innerBlocks: [
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '1' },
						},
					],
				},
				{
					name: 'core/column',
				},
			],
		} );

		await editor.selectBlocks(
			editor.canvas.locator( 'role=document[name="Paragraph block"i]' )
		);
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/columns',
				innerBlocks: [
					{
						name: 'core/column',
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: { content: '1' },
							},
						],
					},
					{
						name: 'core/column',
					},
				],
			},
			{
				name: 'core/paragraph',
				attributes: { content: '2' },
			},
		] );
	} );

	test( 'should not split in middle', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/columns',
			innerBlocks: [
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '1' },
						},
						{
							name: 'core/paragraph',
							attributes: { content: '2' },
						},
					],
				},
				{
					name: 'core/column',
				},
			],
		} );

		await editor.selectBlocks(
			editor.canvas.locator(
				'role=document[name="Paragraph block"i] >> text="1"'
			)
		);
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/columns',
				innerBlocks: [
					{
						name: 'core/column',
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: { content: '1' },
							},
							{
								name: 'core/paragraph',
								attributes: { content: '' },
							},
							{
								name: 'core/paragraph',
								attributes: { content: '3' },
							},
							{
								name: 'core/paragraph',
								attributes: { content: '2' },
							},
						],
					},
					{
						name: 'core/column',
					},
				],
			},
		] );
	} );

	test.describe( 'following paragraph', () => {
		const columnsBlock = {
			name: 'core/columns',
			innerBlocks: [
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '1' },
						},
					],
				},
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '2' },
						},
					],
				},
			],
		};

		test( 'should be deleted on Backspace when empty', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( columnsBlock );
			await editor.insertBlock( { name: 'core/paragraph' } );

			await page.keyboard.press( 'Backspace' );

			expect( await editor.getBlocks() ).toMatchObject( [
				columnsBlock,
			] );

			// Ensure focus is on the columns block.
			await page.keyboard.press( 'Backspace' );

			expect( await editor.getBlocks() ).toMatchObject( [] );
		} );

		test( 'should only select Columns on Backspace when non-empty', async ( {
			editor,
			page,
		} ) => {
			const paragraphBlock = {
				name: 'core/paragraph',
				attributes: { content: 'a' },
			};
			await editor.insertBlock( columnsBlock );
			await editor.insertBlock( paragraphBlock );

			await page.keyboard.press( 'Backspace' );

			expect( await editor.getBlocks() ).toMatchObject( [
				columnsBlock,
				paragraphBlock,
			] );

			// Ensure focus is on the columns block.
			await page.keyboard.press( 'Backspace' );

			expect( await editor.getBlocks() ).toMatchObject( [
				paragraphBlock,
			] );
		} );
	} );
} );
